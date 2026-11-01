-- BloopIQ uses automatic anonymous guest sessions. Players are not asked to
-- declare an age, and gameplay RPCs do not depend on a parental-access record.

do $$
declare v_job_id bigint;
begin
  for v_job_id in
    select jobid from cron.job where jobname = 'bloopiq-parent-consent-retention'
  loop
    perform cron.unschedule(v_job_id);
  end loop;
end;
$$;

alter policy profiles_read_own on public.guest_profiles
  using ((select auth.uid()) = user_id);
alter policy attempts_read_own on public.daily_attempts
  using ((select auth.uid()) = user_id);
alter policy friend_events_read_members on public.friend_room_events
  using ((select private.friend_is_member(room_id)));
grant select, insert, update on public.guest_profiles to authenticated;

create or replace function private.require_user()
returns uuid language plpgsql stable security invoker set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session_id uuid := nullif(auth.jwt()->>'session_id', '')::uuid;
begin
  if v_user is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if v_session_id is not null and not exists (
    select 1 from auth.sessions where id = v_session_id and user_id = v_user
  ) then
    raise exception 'session is no longer valid' using errcode = '28000';
  end if;
  return v_user;
end;
$$;

do $restore_game_functions$
declare r record; d text;
begin
  for r in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'create_friend_room', 'join_friend_room', 'get_friend_room_state',
        'set_friend_ready', 'start_friend_match', 'submit_friend_answer',
        'rematch_friend_room'
      )
  loop
    d := pg_get_functiondef(r.oid);
    d := replace(d, 'private.require_social_user()', 'private.require_user()');
    execute d;
  end loop;

  select pg_get_functiondef('private.friend_state(uuid,boolean)'::regprocedure) into d;
  d := replace(d, 'private.require_social_user()', 'private.require_user()');
  d := replace(d, ' and private.social_access_for(m.user_id)', '');
  d := replace(d, ' and private.social_access_for(p.user_id)', '');
  d := replace(d,
    'if not private.social_access_for((select host_user_id from private.friend_rooms where id=p_room_id)) then raise exception ''This room is no longer available.''; end if; ',
    '');
  execute d;

  select pg_get_functiondef('public.get_leaderboard(text,text,integer)'::regprocedure) into d;
  d := replace(d, ' and private.social_access_for(a.user_id)', '');
  execute d;

  select pg_get_functiondef('public.issue_ad_reward_reference(uuid,text)'::regprocedure) into d;
  d := replace(d, 'private.require_adult_user()', 'private.require_user()');
  execute d;
end;
$restore_game_functions$;

create or replace function public.sync_guest_profile(p_display_name text, p_avatar text, p_avatar_color text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := private.require_user(); v_profile public.guest_profiles%rowtype;
begin
  if char_length(p_display_name) not between 3 and 32
    or lower(p_display_name) ~ '(^|[^a-z0-9])(fuck|shit|bitch|cunt|nigger|nigga|faggot|retard|kike)([^a-z0-9]|$)'
    or char_length(p_avatar) not between 1 and 16 or p_avatar_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'invalid profile';
  end if;
  insert into public.guest_profiles (user_id, display_name, avatar, avatar_color)
  values (v_user, p_display_name, p_avatar, p_avatar_color)
  on conflict (user_id) do update set display_name = excluded.display_name, avatar = excluded.avatar,
    avatar_color = excluded.avatar_color, updated_at = clock_timestamp()
  returning * into v_profile;
  return jsonb_build_object('displayName', v_profile.display_name, 'avatar', v_profile.avatar, 'avatarColor', v_profile.avatar_color);
end;
$$;

revoke all on function public.sync_guest_profile(text, text, text) from public, anon;
grant execute on function public.sync_guest_profile(text, text, text) to authenticated;

create or replace function public.prepare_account_deletion()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_room_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('delete-account:' || v_user::text, 0));
  delete from private.friend_rooms where host_user_id = v_user;

  for v_room_id in
    select room_id from private.friend_room_members where user_id = v_user
  loop
    insert into public.friend_room_events (room_id, kind) values (v_room_id, 'left');
  end loop;

  delete from private.friend_match_players where user_id = v_user;
  delete from private.friend_room_members where user_id = v_user;
  delete from private.friend_rate_events where user_id = v_user;
  delete from private.player_reports where reporter_user_id = v_user or reported_user_id = v_user;
  delete from private.player_blocks where blocker_user_id = v_user or blocked_user_id = v_user;
  delete from private.admob_ssv_events e
  using private.ad_reward_references r
  where r.user_id = v_user and e.reward_reference = r.reference;
  delete from private.ad_reward_references where user_id = v_user;
  delete from public.daily_attempts where user_id = v_user;
  delete from public.guest_profiles where user_id = v_user;

  return jsonb_build_object('ready', true);
end;
$$;

revoke all on function public.prepare_account_deletion() from public, anon;
grant execute on function public.prepare_account_deletion() to authenticated;

drop function if exists public.parent_consent_control(text, text, boolean);
drop function if exists public.parent_consent_status(text);
drop function if exists public.claim_parental_consent(text, text);
drop function if exists public.register_adult_online_access(text);
drop function if exists public.get_online_access_state();
drop function if exists public.has_online_access();

drop function if exists private.expire_parental_consents();
drop function if exists private.approve_parental_consent(text, text, text, text, text, boolean, timestamptz);
drop function if exists private.clear_guest_data(uuid);
drop function if exists private.clear_friend_data(uuid);
drop function if exists private.require_adult_user();
drop function if exists private.child_nickname(uuid);
drop function if exists private.require_social_user();
drop function if exists private.social_access_for(uuid);
drop function if exists private.online_access_for(uuid);
drop function if exists private.require_auth_session();
drop function if exists private.parent_notice_version();

drop table if exists private.online_access;
drop table if exists private.parental_consents;

revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.friend_is_member(uuid) to authenticated;
