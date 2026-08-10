create table if not exists public.site_index_requests (
  id uuid primary key default gen_random_uuid(),
  request_text text not null check (char_length(request_text) between 1 and 500),
  source text not null default 'homepage_supported_docs',
  created_at timestamptz not null default now()
);

alter table public.site_index_requests enable row level security;

create index if not exists site_index_requests_created_at_idx
  on public.site_index_requests(created_at desc);
