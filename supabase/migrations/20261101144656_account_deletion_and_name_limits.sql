-- Account deletion is initiated by the authenticated user through the
-- delete-account Edge Function. This function removes rows that deliberately
-- use ON DELETE RESTRICT before the Edge Function deletes auth.users.

create table private.player_blocks (
  blocker_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default clock_timestamp(),
  primary key (blocker_user_id, blocked_user_id),
  constraint player_blocks_not_self check (blocker_user_id <> blocked_user_id)
);

create index player_blocks_blocked_idx on private.player_blocks (blocked_user_id, blocker_user_id);

create table private.player_reports (
  id bigint generated always as identity primary key,
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  reported_name text not null,
  context text not null,
  room_id uuid references private.friend_rooms(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  constraint player_reports_not_self check (reporter_user_id <> reported_user_id),
  constraint player_reports_context check (context in ('rankings', 'friends')),
  constraint player_reports_name_length check (char_length(reported_name) between 1 and 32)
);

create index player_reports_review_idx on private.player_reports (created_at desc);
create index player_reports_reported_idx on private.player_reports (reported_user_id, created_at desc);
create index player_reports_reporter_idx on private.player_reports (reporter_user_id, created_at desc);
create index player_reports_room_idx on private.player_reports (room_id) where room_id is not null;

alter table private.player_blocks enable row level security;
alter table private.player_reports enable row level security;
revoke all on private.player_blocks, private.player_reports from public, anon, authenticated;

-- Supabase access tokens are stateless and can otherwise remain usable until
-- expiry after auth.users is deleted. Production JWTs include session_id, so
-- sensitive RPCs reject a token as soon as its Auth session row is gone.
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

create or replace function public.report_and_block_player(
  p_reported_user_id uuid,
  p_context text,
  p_room_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_name text;
begin
  if v_user is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  if p_reported_user_id = v_user then raise exception 'You cannot report yourself.' using errcode = '22023'; end if;
  if p_context not in ('rankings', 'friends') then raise exception 'Invalid report context.' using errcode = '22023'; end if;

  select display_name into v_name from public.guest_profiles where user_id = p_reported_user_id;
  if v_name is null then raise exception 'Player not found.' using errcode = 'P0001'; end if;

  if p_context = 'friends' then
    if p_room_id is null or not exists (
      select 1 from private.friend_room_members reporter
      join private.friend_room_members reported on reported.room_id = reporter.room_id
      where reporter.room_id = p_room_id and reporter.user_id = v_user
        and reported.user_id = p_reported_user_id
        and reporter.left_at is null and reported.left_at is null
    ) then
      raise exception 'Both players must be in the room.' using errcode = '42501';
    end if;
  elsif not exists (
    select 1 from public.daily_attempts where user_id = p_reported_user_id and status = 'completed'
  ) then
    raise exception 'Player is not present in rankings.' using errcode = 'P0001';
  end if;

  insert into private.player_reports (reporter_user_id, reported_user_id, reported_name, context, room_id)
  values (v_user, p_reported_user_id, v_name, p_context, p_room_id);
  insert into private.player_blocks (blocker_user_id, blocked_user_id)
  values (v_user, p_reported_user_id)
  on conflict do nothing;

  if p_context = 'friends' then
    update private.friend_room_members
    set left_at = clock_timestamp(), last_seen_at = clock_timestamp()
    where room_id = p_room_id and user_id = v_user;
    insert into public.friend_room_events (room_id, kind) values (p_room_id, 'left');
  end if;

  return jsonb_build_object('reported', true, 'blocked', true);
end;
$$;

revoke all on function public.report_and_block_player(uuid, text, uuid) from public, anon;
grant execute on function public.report_and_block_player(uuid, text, uuid) to authenticated;

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

  -- Hosted rooms contain snapshots of every participant, so deleting the host
  -- removes the room and its cascaded match data. In rooms hosted by someone
  -- else, remove only this user's membership and match history.
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

comment on function public.prepare_account_deletion() is
  'Removes caller-owned application data and ON DELETE RESTRICT rows before server-side Auth deletion.';

-- Friends already enforces 32 characters. Align the canonical profile and RPC
-- after safely truncating legacy 33-40 character values.
update public.guest_profiles
set display_name = left(display_name, 32), updated_at = clock_timestamp()
where char_length(display_name) > 32;

alter table public.guest_profiles drop constraint guest_profiles_name_length;
alter table public.guest_profiles add constraint guest_profiles_name_length
  check (char_length(display_name) between 3 and 32);

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

create or replace function public.get_leaderboard(
  p_category_id text default 'flags',
  p_period text default 'today',
  p_limit integer default 20
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := private.require_user();
  v_today date := private.utc_today();
  v_week_start date := private.utc_today() - (extract(isodow from private.utc_today())::integer - 1);
  v_entries jsonb;
begin
  if p_period not in ('today', 'week') then raise exception 'invalid period'; end if;
  p_limit := least(greatest(p_limit, 1), 50);
  if p_period = 'today' then
    with ranked as (
      select a.user_id, a.score, a.active_duration_ms,
        rank() over (order by a.score desc, a.active_duration_ms asc) as position
      from public.daily_attempts a join public.daily_challenges c on c.id = a.challenge_id
      where a.category_id = p_category_id and a.status = 'completed' and c.challenge_date = v_today
    ), chosen as (
      select * from ranked r
      where (position <= p_limit or user_id = v_user)
        and (user_id = v_user or not exists (
          select 1 from private.player_blocks b
          where (b.blocker_user_id = v_user and b.blocked_user_id = r.user_id)
             or (b.blocker_user_id = r.user_id and b.blocked_user_id = v_user)
        ))
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'userId', c.user_id, 'position', c.position, 'displayName', coalesce(p.display_name, 'Guest Player'),
      'avatar', coalesce(p.avatar, '●'), 'avatarColor', coalesce(p.avatar_color, '#2D9CDB'),
      'score', c.score, 'durationMs', c.active_duration_ms, 'isCurrentPlayer', c.user_id = v_user
    ) order by c.position, c.active_duration_ms), '[]'::jsonb)
    into v_entries from chosen c left join public.guest_profiles p on p.user_id = c.user_id;
    return jsonb_build_object('period', 'today', 'categoryId', p_category_id,
      'boundaryStart', v_today, 'boundaryEnd', v_today + 1, 'entries', v_entries);
  end if;

  with totals as (
    select a.user_id, sum(a.score)::integer as score, sum(a.active_duration_ms)::bigint as duration_ms
    from public.daily_attempts a join public.daily_challenges c on c.id = a.challenge_id
    where a.category_id = p_category_id and a.status = 'completed'
      and c.challenge_date between v_week_start and v_week_start + 6
    group by a.user_id
  ), ranked as (
    select *, rank() over (order by score desc, duration_ms asc) as position from totals
  ), chosen as (
    select * from ranked r
    where (position <= p_limit or user_id = v_user)
      and (user_id = v_user or not exists (
        select 1 from private.player_blocks b
        where (b.blocker_user_id = v_user and b.blocked_user_id = r.user_id)
           or (b.blocker_user_id = r.user_id and b.blocked_user_id = v_user)
      ))
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'userId', c.user_id, 'position', c.position, 'displayName', coalesce(p.display_name, 'Guest Player'),
    'avatar', coalesce(p.avatar, '●'), 'avatarColor', coalesce(p.avatar_color, '#2D9CDB'),
    'score', c.score, 'durationMs', c.duration_ms, 'isCurrentPlayer', c.user_id = v_user
  ) order by c.position, c.duration_ms), '[]'::jsonb)
  into v_entries from chosen c left join public.guest_profiles p on p.user_id = c.user_id;
  return jsonb_build_object('period', 'week', 'categoryId', p_category_id,
    'boundaryStart', v_week_start, 'boundaryEnd', v_week_start + 7, 'entries', v_entries);
end;
$$;

revoke all on function public.get_leaderboard(text, text, integer) from public, anon;
grant execute on function public.get_leaderboard(text, text, integer) to authenticated;

create or replace function public.join_friend_room(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := private.require_user(); v_room private.friend_rooms%rowtype; v_existing boolean;
begin
  perform private.friend_rate_limit(v_user, 'join', 20, interval '5 minutes');
  select * into v_room from private.friend_rooms where code = upper(trim(p_code)) for update;
  if not found then raise exception 'Room not found. Check the code and try again.' using errcode = 'P0001'; end if;
  perform private.friend_reconcile(v_room.id);
  select * into v_room from private.friend_rooms where id = v_room.id for update;

  if exists (
    select 1
    from private.friend_room_members member
    join private.player_blocks block
      on (block.blocker_user_id = v_user and block.blocked_user_id = member.user_id)
      or (block.blocker_user_id = member.user_id and block.blocked_user_id = v_user)
    where member.room_id = v_room.id and member.left_at is null
  ) then
    raise exception 'This room contains a blocked player.' using errcode = 'P0001';
  end if;

  select exists(select 1 from private.friend_room_members where room_id = v_room.id and user_id = v_user) into v_existing;
  if v_existing then
    update private.friend_room_members set left_at = null, last_seen_at = clock_timestamp()
    where room_id = v_room.id and user_id = v_user and (v_room.status = 'lobby' or left_at is null);
    if not found then raise exception 'This match has already started.' using errcode = 'P0001'; end if;
    return private.friend_state(v_room.id);
  end if;
  if v_room.status <> 'lobby' then raise exception 'This room is no longer accepting players.' using errcode = 'P0001'; end if;
  if (select count(*) from private.friend_room_members where room_id = v_room.id and left_at is null) >= 8 then
    raise exception 'This room is full.' using errcode = 'P0001';
  end if;
  insert into private.friend_room_members(room_id, user_id, display_name, avatar, avatar_color)
    select v_room.id, user_id, display_name, avatar, avatar_color from public.guest_profiles where user_id = v_user;
  if not found then raise exception 'Profile must be synced first.'; end if;
  perform private.friend_emit(v_room.id, 'member');
  return private.friend_state(v_room.id);
end;
$$;

revoke all on function public.join_friend_room(text) from public, anon;
grant execute on function public.join_friend_room(text) to authenticated;
