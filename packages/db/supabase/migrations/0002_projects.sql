-- 0002_projects: estimate snapshots behind short links `/p/<id>` (P7.1, P17.17) and the return metric.
-- RLS on, zero policies: only the server (secret key) reads or writes.
-- Functions: 0001's `alter default privileges in schema public revoke … from public` cannot take back the global
-- EXECUTE that PUBLIC gets on every new function, so each function revokes it explicitly.

create table public.projects (
  -- 8 random chars without look-alikes (no 0/O/o, 1/l/I).
  id text primary key check (id ~ '^[2-9a-kmnp-zA-HJ-NP-Z]{8}$'),
  -- ProjectData (estimate schema 2), validated by Zod on the server and capped there at 32 KB of compact JSON.
  -- jsonb prints a space after every `:` and `,` (+25 % on an estimate), so the guard here is a looser backstop.
  data jsonb not null check (octet_length(data::text) <= 65536),
  schema_version smallint not null,
  country text not null check (country in ('RU', 'KZ', 'BY', 'KG')),
  -- SHA-256 hex of the editToken; the token itself lives only in the owner's browser.
  edit_token_hash text not null check (edit_token_hash ~ '^[0-9a-f]{64}$'),
  tg_user_id bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Starts at creation: the owner looking at a fresh link is not a return. Cleanup keys on it (12 months).
  last_opened_at timestamptz not null default now()
);

alter table public.projects enable row level security;
grant select, insert, update, delete on public.projects to service_role;

create index projects_last_opened_at_idx on public.projects (last_opened_at);
create index projects_tg_user_id_idx on public.projects (tg_user_id) where tg_user_id is not null;

create table public.project_opens (
  project_id text not null references public.projects (id) on delete cascade,
  day date not null,
  count integer not null default 0 check (count >= 0),
  primary key (project_id, day)
);

alter table public.project_opens enable row level security;
grant select, insert, update, delete on public.project_opens to service_role;

-- Marks an open: a return counts only when more than an hour passed since the previous one.
-- Returns false when the project does not exist.
create function public.project_touch(p_id text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_exists boolean;
begin
  update public.projects
     set last_opened_at = now()
   where id = p_id
     and last_opened_at < now() - interval '1 hour';

  if found then
    insert into public.project_opens (project_id, day, count)
    values (p_id, current_date, 1)
    on conflict (project_id, day) do update set count = public.project_opens.count + 1;
    return true;
  end if;

  select exists (select 1 from public.projects where id = p_id) into v_exists;
  return v_exists;
end;
$$;

revoke execute on function public.project_touch(text) from public, anon, authenticated;
grant execute on function public.project_touch(text) to service_role;
