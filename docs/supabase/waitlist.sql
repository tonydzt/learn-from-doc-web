create table if not exists public.waitlist_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  interested_features text[] not null,
  consent_scope text not null default 'feature_completion_only',
  source text not null default 'homepage_waitlist',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.waitlist_notifications (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  total_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.waitlist_notification_recipients (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.waitlist_notifications(id) on delete cascade,
  subscriber_id uuid references public.waitlist_subscribers(id) on delete set null,
  email text not null,
  status text not null check (status in ('sent', 'failed')),
  resend_id text,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.waitlist_subscribers enable row level security;
alter table public.waitlist_notifications enable row level security;
alter table public.waitlist_notification_recipients enable row level security;

create index if not exists waitlist_subscribers_created_at_idx
  on public.waitlist_subscribers(created_at desc);

create index if not exists waitlist_notifications_created_at_idx
  on public.waitlist_notifications(created_at desc);

create index if not exists waitlist_notification_recipients_notification_id_idx
  on public.waitlist_notification_recipients(notification_id);
