-- Isolated showroom rate limiter for its own Supabase project.
-- This NEVER touches APK Owner, Member, or Technician data.
create table showroom_internal.login_attempts(
  key_hash text primary key,
  attempts int not null default 0,
  window_started timestamptz not null default now(),
  blocked_until timestamptz
);
alter table showroom_internal.login_attempts enable row level security;
revoke all on showroom_internal.login_attempts from public,anon,authenticated;

create function public.showroom_consume_rate_limit(
 p_hash text,p_limit integer,p_window_seconds integer,p_block_seconds integer
) returns boolean language plpgsql security definer set search_path=''
as $$
declare attempt_count integer; blocked timestamptz;
begin
 if length(p_hash) <> 64 or p_limit not between 1 and 50
   or p_window_seconds not between 60 and 86400
   or p_block_seconds not between 60 and 86400 then
   return false;
 end if;
 insert into showroom_internal.login_attempts as log(key_hash,attempts,window_started,blocked_until)
 values(p_hash,1,now(),null)
 on conflict(key_hash) do update
 set attempts=case when log.window_started+make_interval(secs=>p_window_seconds)<now() then 1 else log.attempts+1 end,
     window_started=case when log.window_started+make_interval(secs=>p_window_seconds)<now() then now() else log.window_started end,
     blocked_until=case
       when log.blocked_until>now() then log.blocked_until
       when log.window_started+make_interval(secs=>p_window_seconds)>=now() and log.attempts+1>p_limit
         then now()+make_interval(secs=>p_block_seconds)
       else null end
 returning attempts,blocked_until into attempt_count,blocked;
 return blocked is null and attempt_count<=p_limit;
end;
$$;
revoke all on function public.showroom_consume_rate_limit(text,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.showroom_consume_rate_limit(text,integer,integer,integer) to service_role;
