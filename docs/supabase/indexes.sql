create table if not exists public.indexes (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('system', 'user_upload')),
  owner_user_id uuid references auth.users(id) on delete cascade,
  site_id text not null,
  host text not null,
  scope_key text not null,
  scope_title text not null,
  schema_version integer not null,
  version text not null,
  content_hash text,
  page_count integer not null default 0 check (page_count >= 0),
  index_snapshot jsonb not null,
  indexed_at timestamptz not null,
  review_status text not null default 'none' check (review_status in ('none', 'pending', 'approved', 'rejected')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  review_note text,
  system_status text not null default 'inactive' check (system_status in ('inactive', 'active')),
  approved_from_index_id uuid references public.indexes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint indexes_owner_required_for_upload check (
    (source = 'system' and owner_user_id is null)
    or (source = 'user_upload' and owner_user_id is not null)
  ),
  constraint indexes_unique_user_upload_identity unique (source, owner_user_id, site_id)
);

alter table public.indexes add column if not exists review_status text not null default 'none';
alter table public.indexes add column if not exists submitted_at timestamptz;
alter table public.indexes add column if not exists reviewed_at timestamptz;
alter table public.indexes add column if not exists reviewed_by_user_id uuid references auth.users(id) on delete set null;
alter table public.indexes add column if not exists review_note text;
alter table public.indexes add column if not exists system_status text not null default 'inactive';
alter table public.indexes add column if not exists approved_from_index_id uuid references public.indexes(id) on delete set null;

alter table public.indexes drop constraint if exists indexes_review_status_check;
alter table public.indexes add constraint indexes_review_status_check
  check (review_status in ('none', 'pending', 'approved', 'rejected'));

alter table public.indexes drop constraint if exists indexes_system_status_check;
alter table public.indexes add constraint indexes_system_status_check
  check (system_status in ('inactive', 'active'));

update public.indexes
set system_status = 'active', review_status = 'approved'
where source = 'system'
  and system_status = 'inactive'
  and not exists (
    select 1
    from public.indexes newer
    where newer.source = 'system'
      and newer.site_id = indexes.site_id
      and newer.updated_at > indexes.updated_at
  );

drop index if exists indexes_unique_system_site;

create unique index if not exists indexes_unique_active_system_site
  on public.indexes(site_id)
  where source = 'system' and system_status = 'active';

create unique index if not exists indexes_unique_user_upload_owner_site
  on public.indexes(owner_user_id, site_id)
  where source = 'user_upload';

create table if not exists public.index_pages (
  id uuid primary key default gen_random_uuid(),
  index_id uuid not null references public.indexes(id) on delete cascade,
  site_id text not null,
  url text not null,
  title text not null,
  "order" integer not null,
  content_height integer,
  content_hash text,
  structure_hash text,
  indexed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint index_pages_unique_index_url unique (index_id, url)
);

create table if not exists public.user_indexes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  index_id uuid not null references public.indexes(id) on delete cascade,
  relation_source text not null check (relation_source in ('synced_system', 'uploaded')),
  synced_index_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_indexes_unique_user_index unique (user_id, index_id)
);

create table if not exists public.user_page_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_index_id uuid not null references public.user_indexes(id) on delete cascade,
  index_page_id uuid references public.index_pages(id) on delete set null,
  site_id text not null,
  url text not null,
  title text,
  "order" integer,
  content_height integer,
  viewed_height integer not null default 0 check (viewed_height >= 0),
  progress_percent numeric(5, 2) not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  raw_progress_version integer,
  raw_progress jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_page_progress_unique_user_index_url unique (user_id, user_index_id, url)
);

alter table public.indexes enable row level security;
alter table public.index_pages enable row level security;
alter table public.user_indexes enable row level security;
alter table public.user_page_progress enable row level security;

drop policy if exists "Users can read accessible indexes" on public.indexes;
drop policy if exists "Users can insert their uploaded indexes" on public.indexes;
drop policy if exists "Users can update their uploaded indexes" on public.indexes;
drop policy if exists "Users can delete their uploaded indexes" on public.indexes;

create policy "Users can read accessible indexes"
  on public.indexes
  for select
  to authenticated
  using (
    source = 'system'
    or owner_user_id = auth.uid()
    or exists (
      select 1
      from public.user_indexes
      where user_indexes.index_id = indexes.id
        and user_indexes.user_id = auth.uid()
    )
  );

create policy "Users can insert their uploaded indexes"
  on public.indexes
  for insert
  to authenticated
  with check (source = 'user_upload' and owner_user_id = auth.uid());

create policy "Users can update their uploaded indexes"
  on public.indexes
  for update
  to authenticated
  using (source = 'user_upload' and owner_user_id = auth.uid())
  with check (source = 'user_upload' and owner_user_id = auth.uid());

create policy "Users can delete their uploaded indexes"
  on public.indexes
  for delete
  to authenticated
  using (source = 'user_upload' and owner_user_id = auth.uid());

drop policy if exists "Users can read pages for accessible indexes" on public.index_pages;
drop policy if exists "Users can manage pages for uploaded indexes" on public.index_pages;

create policy "Users can read pages for accessible indexes"
  on public.index_pages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.indexes
      where indexes.id = index_pages.index_id
        and (
          indexes.source = 'system'
          or indexes.owner_user_id = auth.uid()
          or exists (
            select 1
            from public.user_indexes
            where user_indexes.index_id = indexes.id
              and user_indexes.user_id = auth.uid()
          )
        )
    )
  );

create policy "Users can manage pages for uploaded indexes"
  on public.index_pages
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.indexes
      where indexes.id = index_pages.index_id
        and indexes.source = 'user_upload'
        and indexes.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.indexes
      where indexes.id = index_pages.index_id
        and indexes.source = 'user_upload'
        and indexes.owner_user_id = auth.uid()
    )
  );

drop policy if exists "Users can manage their index relations" on public.user_indexes;
drop policy if exists "Users can manage their page progress" on public.user_page_progress;

create policy "Users can manage their index relations"
  on public.user_indexes
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their page progress"
  on public.user_page_progress
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists indexes_source_idx on public.indexes(source);
create index if not exists indexes_site_id_idx on public.indexes(site_id);
create index if not exists indexes_host_idx on public.indexes(host);
create index if not exists indexes_owner_user_id_idx on public.indexes(owner_user_id);
create index if not exists index_pages_index_id_idx on public.index_pages(index_id);
create index if not exists index_pages_site_id_idx on public.index_pages(site_id);
create index if not exists index_pages_url_idx on public.index_pages(url);
create index if not exists user_indexes_user_id_idx on public.user_indexes(user_id);
create index if not exists user_indexes_index_id_idx on public.user_indexes(index_id);
create index if not exists user_page_progress_user_id_idx on public.user_page_progress(user_id);
create index if not exists user_page_progress_user_index_id_idx on public.user_page_progress(user_index_id);
create index if not exists user_page_progress_index_page_id_idx on public.user_page_progress(index_page_id);
create index if not exists user_page_progress_url_idx on public.user_page_progress(url);

create or replace function public.set_indexes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_index_pages_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_user_indexes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_user_page_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_indexes_updated_at on public.indexes;
create trigger set_indexes_updated_at
  before update on public.indexes
  for each row
  execute function public.set_indexes_updated_at();

drop trigger if exists set_index_pages_updated_at on public.index_pages;
create trigger set_index_pages_updated_at
  before update on public.index_pages
  for each row
  execute function public.set_index_pages_updated_at();

drop trigger if exists set_user_indexes_updated_at on public.user_indexes;
create trigger set_user_indexes_updated_at
  before update on public.user_indexes
  for each row
  execute function public.set_user_indexes_updated_at();

drop trigger if exists set_user_page_progress_updated_at on public.user_page_progress;
create trigger set_user_page_progress_updated_at
  before update on public.user_page_progress
  for each row
  execute function public.set_user_page_progress_updated_at();
