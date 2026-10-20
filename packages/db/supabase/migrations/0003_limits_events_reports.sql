-- 0003_limits_events_reports: API rate limits, anonymous event totals, «Сообщить об ошибке» (P7.1).
-- RLS on, zero policies. No IP is stored: limit keys carry a salted daily hash.

create table public.rate_limits (
  key text not null check (length(key) <= 200),
  window_start timestamptz not null,
  count integer not null default 0 check (count >= 0),
  primary key (key, window_start)
);

alter table public.rate_limits enable row level security;
grant select, insert, update, delete on public.rate_limits to service_role;

create index rate_limits_window_start_idx on public.rate_limits (window_start);

-- Counts one hit in the current fixed window and says whether it is still within `p_max`.
create function public.hit_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  insert into public.rate_limits as r (key, window_start, count)
  values (
    p_key,
    to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds),
    1
  )
  on conflict (key, window_start) do update set count = r.count + 1
  returning count <= p_max;
$$;

revoke execute on function public.hit_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_limit(text, integer, integer) to service_role;

create table public.events_daily (
  day date not null,
  event text not null check (length(event) <= 40),
  tool text not null default '' check (length(tool) <= 40),
  country text not null default '' check (country in ('', 'RU', 'KZ', 'BY', 'KG')),
  source text not null default '' check (length(source) <= 20),
  count integer not null default 0 check (count >= 0),
  primary key (day, event, tool, country, source)
);

alter table public.events_daily enable row level security;
grant select, insert, update, delete on public.events_daily to service_role;

create function public.event_add(
  p_event text,
  p_tool text default '',
  p_country text default '',
  p_source text default '',
  p_count integer default 1
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.events_daily as e (day, event, tool, country, source, count)
  values (current_date, p_event, p_tool, p_country, p_source, p_count)
  on conflict (day, event, tool, country, source) do update set count = e.count + excluded.count;
$$;

revoke execute on function public.event_add(text, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.event_add(text, text, text, text, integer) to service_role;

create table public.error_reports (
  id bigint generated always as identity primary key,
  tool text check (length(tool) <= 40),
  tool_version integer,
  -- Capped at 32 KB of compact JSON on the server; jsonb text is longer, so this is a looser backstop.
  input jsonb check (input is null or octet_length(input::text) <= 65536),
  message text not null check (length(message) between 1 and 2000),
  page_url text check (length(page_url) <= 500),
  status text not null default 'new' check (status in ('new', 'done', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.error_reports enable row level security;
grant select, insert, update, delete on public.error_reports to service_role;

create index error_reports_created_at_idx on public.error_reports (created_at);
