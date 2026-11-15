create table public.atunagas_sessions (
  id text primary key,
  track text not null,
  driver text not null,
  vehicle text not null,
  entrants integer not null check (entrants between 6 and 15),
  seed bigint not null check (seed between 0 and 4294967295),
  created bigint not null
);

create index atunagas_sessions_created_idx on public.atunagas_sessions (created);

create table public.atunagas_scores (
  id text primary key,
  name text not null check (char_length(name) between 2 and 24),
  time_ms integer not null check (time_ms > 0),
  driver text not null,
  vehicle text not null,
  track text not null,
  locality text not null,
  direction integer not null check (direction in (1, 2)),
  date timestamptz not null default now(),
  request_hash text not null
);

create index atunagas_scores_time_idx on public.atunagas_scores (time_ms, date, id);
create index atunagas_scores_route_idx on public.atunagas_scores (track, time_ms, date, id);
create index atunagas_scores_town_idx on public.atunagas_scores (locality, time_ms, date, id);

create table public.atunagas_request_limits (
  minute bigint not null,
  bucket text not null,
  hits integer not null,
  primary key (minute, bucket)
);

alter table public.atunagas_scores enable row level security;
alter table public.atunagas_sessions enable row level security;
alter table public.atunagas_request_limits enable row level security;
revoke all on public.atunagas_scores, public.atunagas_sessions, public.atunagas_request_limits from public, anon, authenticated;
grant select, insert, update, delete on public.atunagas_scores, public.atunagas_sessions, public.atunagas_request_limits to service_role;

create function public.atunagas_allow_action(p_bucket text, p_limit integer)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_minute bigint := floor(extract(epoch from statement_timestamp()) / 60);
  requests integer;
begin
  insert into public.atunagas_request_limits as limits (minute, bucket, hits)
  values (current_minute, p_bucket, 1)
  on conflict (minute, bucket) do update set hits = least(limits.hits + 1, p_limit + 1)
  returning hits into requests;
  if p_bucket like 'global:%' and requests = 1 then
    delete from public.atunagas_request_limits where minute < current_minute - 5;
    delete from public.atunagas_sessions where created < (current_minute - 1440) * 60000;
  end if;
  return requests <= p_limit;
end;
$$;

create function public.atunagas_rank(p_id text)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select 1 + (
    select count(*) from public.atunagas_scores as before_score
    where before_score.track = saved.track
      and (before_score.time_ms, before_score.date, before_score.id) < (saved.time_ms, saved.date, saved.id)
  )::integer
  from public.atunagas_scores as saved
  where saved.id = p_id
$$;

revoke execute on function public.atunagas_allow_action(text, integer), public.atunagas_rank(text) from public, anon, authenticated;
grant execute on function public.atunagas_allow_action(text, integer), public.atunagas_rank(text) to service_role;
