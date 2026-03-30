-- Logs table
create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  ts timestamptz not null default now(),
  source text not null default 'unknown',
  level text not null default 'info',
  message text not null,
  meta jsonb not null default '{}',
  raw text,
  ingest_key text,
  ip inet,
  user_agent text
);

-- Useful indexes
create index if not exists logs_ts_idx on public.logs (ts desc);
create index if not exists logs_level_idx on public.logs (level);
create index if not exists logs_source_idx on public.logs (source);
create index if not exists logs_meta_gin on public.logs using gin (meta);

-- Enable realtime
alter publication supabase_realtime add table public.logs;




-- System metrics for dashboard
create table if not exists public.system_metrics (
  metric_name text primary key,
  metric_value numeric not null default 0,
  metric_unit text not null default 'count',
  recorded_at timestamptz not null default now()
);
create index if not exists system_metrics_recorded_at_idx on public.system_metrics (recorded_at desc);