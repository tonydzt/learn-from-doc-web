create table if not exists public.user_permission_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  permission_key text not null check (permission_key in ('canSync', 'canPullServerData')),
  source text not null,
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint user_permission_grants_valid_window check (expires_at > starts_at),
  constraint user_permission_grants_unique_source unique (user_id, permission_key, source)
);

alter table public.user_permission_grants enable row level security;

drop policy if exists "Users can read their own permission grants"
  on public.user_permission_grants;

create policy "Users can read their own permission grants"
  on public.user_permission_grants
  for select
  to authenticated
  using (auth.uid() = user_id);

create index if not exists user_permission_grants_user_id_idx
  on public.user_permission_grants(user_id);

create index if not exists user_permission_grants_permission_key_idx
  on public.user_permission_grants(permission_key);

create index if not exists user_permission_grants_expires_at_idx
  on public.user_permission_grants(expires_at);

create or replace function public.create_pre_2028_permission_grants_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_at < timestamptz '2028-01-01T00:00:00Z' then
    insert into public.user_permission_grants (
      user_id,
      permission_key,
      source,
      starts_at,
      expires_at
    )
    select
      new.id,
      permissions.permission_key,
      'legacy_pre_2028',
      new.created_at,
      new.created_at + interval '3 months'
    from (
      values
        ('canSync'),
        ('canPullServerData')
    ) as permissions(permission_key)
    on conflict (user_id, permission_key, source) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists create_pre_2028_permission_grants_after_auth_signup
  on auth.users;

create trigger create_pre_2028_permission_grants_after_auth_signup
  after insert on auth.users
  for each row
  execute function public.create_pre_2028_permission_grants_for_auth_user();

insert into public.user_permission_grants (
  user_id,
  permission_key,
  source,
  starts_at,
  expires_at
)
select
  users.id,
  permissions.permission_key,
  'legacy_pre_2028',
  users.created_at,
  users.created_at + interval '3 months'
from auth.users
cross join (
  values
    ('canSync'),
    ('canPullServerData')
) as permissions(permission_key)
where users.created_at < timestamptz '2028-01-01T00:00:00Z'
on conflict (user_id, permission_key, source) do nothing;
