create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 32),
  avatar_initial text not null check (char_length(avatar_initial) = 1),
  avatar_background text not null check (avatar_background ~ '^#[0-9A-Fa-f]{6}$'),
  avatar_color text not null check (avatar_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "Users can read their own profile"
  on public.user_profiles;

drop policy if exists "Users can insert their own profile"
  on public.user_profiles;

drop policy if exists "Users can update their own profile"
  on public.user_profiles;

create policy "Users can read their own profile"
  on public.user_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.user_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.user_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.random_profile_nickname()
returns text
language sql
volatile
as $$
  select string_agg(substr(chars.value, floor(random() * length(chars.value) + 1)::integer, 1), '')
  from generate_series(1, 8)
  cross join (values ('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')) as chars(value);
$$;

create or replace function public.random_avatar_background()
returns text
language sql
volatile
as $$
  select backgrounds.value[floor(random() * array_length(backgrounds.value, 1) + 1)::integer]
  from (values (array['#174E63', '#7B3F3F', '#275C42', '#6E4B8B', '#9B4D28', '#263B73'])) as backgrounds(value);
$$;

create or replace function public.random_avatar_color()
returns text
language sql
volatile
as $$
  select colors.value[floor(random() * array_length(colors.value, 1) + 1)::integer]
  from (values (array['#F9C846', '#FFFFFF', '#CDE7FF', '#FFE3D8', '#D7F7DF', '#F5E6FF'])) as colors(value);
$$;

create or replace function public.set_user_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_profiles_updated_at
  on public.user_profiles;

create trigger set_user_profiles_updated_at
  before update on public.user_profiles
  for each row
  execute function public.set_user_profile_updated_at();

create or replace function public.create_user_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (
    user_id,
    nickname,
    avatar_initial,
    avatar_background,
    avatar_color
  )
  values (
    new.id,
    public.random_profile_nickname(),
    upper(substr(coalesce(new.email, 'U'), 1, 1)),
    public.random_avatar_background(),
    public.random_avatar_color()
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_user_profile_after_auth_signup
  on auth.users;

create trigger create_user_profile_after_auth_signup
  after insert on auth.users
  for each row
  execute function public.create_user_profile_for_auth_user();

insert into public.user_profiles (
  user_id,
  nickname,
  avatar_initial,
  avatar_background,
  avatar_color
)
select
  users.id,
  public.random_profile_nickname(),
  upper(substr(coalesce(users.email, 'U'), 1, 1)),
  public.random_avatar_background(),
  public.random_avatar_color()
from auth.users
on conflict (user_id) do nothing;
