-- BloopIQ Play with Friends: private room/match state with an RLS-protected
-- public invalidation stream for Supabase Realtime Postgres Changes.

create table private.friend_rooms (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique,
  category_id text not null references public.categories(id) on delete restrict,
  host_user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'lobby',
  current_match_id uuid,
  match_sequence integer not null default 0,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp() + interval '30 minutes'),
  constraint friend_rooms_code_format check (code ~ '^[A-HJ-KM-NP-Z2-9]{6}$'),
  constraint friend_rooms_status check (status in ('lobby', 'playing', 'results', 'closed'))
);

create table private.friend_room_members (
  room_id uuid not null references private.friend_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  display_name text not null,
  avatar text not null,
  avatar_color text not null,
  is_ready boolean not null default false,
  joined_at timestamptz not null default clock_timestamp(),
  last_seen_at timestamptz not null default clock_timestamp(),
  left_at timestamptz,
  primary key (room_id, user_id),
  constraint friend_member_name_length check (char_length(display_name) between 1 and 32),
  constraint friend_member_avatar_length check (char_length(avatar) between 1 and 16),
  constraint friend_member_color_format check (avatar_color ~ '^#[0-9A-Fa-f]{6}$')
);

create index friend_room_members_user_idx on private.friend_room_members (user_id, room_id);
create index friend_room_members_active_idx on private.friend_room_members (room_id, joined_at) where left_at is null;

create table private.friend_matches (
  id uuid primary key default extensions.gen_random_uuid(),
  room_id uuid not null references private.friend_rooms(id) on delete cascade,
  sequence integer not null,
  category_id text not null references public.categories(id) on delete restrict,
  content_version text not null,
  status text not null default 'scheduled',
  starts_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  unique (room_id, sequence),
  constraint friend_matches_status check (status in ('scheduled', 'completed'))
);

alter table private.friend_rooms
  add constraint friend_rooms_current_match_fk foreign key (current_match_id)
  references private.friend_matches(id) on delete set null;

create table private.friend_match_players (
  match_id uuid not null references private.friend_matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  display_name text not null,
  avatar text not null,
  avatar_color text not null,
  joined_order smallint not null,
  primary key (match_id, user_id),
  unique (match_id, joined_order)
);

create index friend_match_players_user_idx on private.friend_match_players (user_id, match_id);

create table private.friend_match_rounds (
  match_id uuid not null references private.friend_matches(id) on delete cascade,
  question_index smallint not null,
  item_id text not null,
  asset_path text not null,
  options jsonb not null,
  correct_choice_id uuid not null,
  primary key (match_id, question_index),
  unique (match_id, item_id),
  constraint friend_round_index check (question_index between 0 and 9),
  constraint friend_round_options check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4)
);

create table private.friend_answers (
  match_id uuid not null,
  user_id uuid not null,
  question_index smallint not null,
  request_id uuid not null,
  choice_id uuid,
  is_correct boolean not null,
  points integer not null,
  elapsed_ms integer not null,
  answered_at timestamptz not null default clock_timestamp(),
  primary key (match_id, user_id, question_index),
  unique (match_id, user_id, request_id),
  foreign key (match_id, user_id) references private.friend_match_players(match_id, user_id) on delete cascade,
  foreign key (match_id, question_index) references private.friend_match_rounds(match_id, question_index) on delete cascade,
  constraint friend_answer_points check (points between 0 and 1000),
  constraint friend_answer_elapsed check (elapsed_ms between 0 and 10000)
);

create index friend_answers_match_score_idx on private.friend_answers (match_id, user_id);

create table private.friend_rate_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  occurred_at timestamptz not null default clock_timestamp(),
  constraint friend_rate_action check (action in ('create', 'join'))
);

create index friend_rate_events_lookup_idx on private.friend_rate_events (user_id, action, occurred_at desc);

create table public.friend_room_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references private.friend_rooms(id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default clock_timestamp(),
  constraint friend_event_kind check (kind in ('member', 'ready', 'started', 'answer', 'phase', 'left', 'rematch', 'closed'))
);

create index friend_room_events_room_idx on public.friend_room_events (room_id, id desc);

alter table private.friend_rooms enable row level security;
alter table private.friend_room_members enable row level security;
alter table private.friend_matches enable row level security;
alter table private.friend_match_players enable row level security;
alter table private.friend_match_rounds enable row level security;
alter table private.friend_answers enable row level security;
alter table private.friend_rate_events enable row level security;
alter table public.friend_room_events enable row level security;

revoke all on table private.friend_rooms, private.friend_room_members, private.friend_matches,
  private.friend_match_players, private.friend_match_rounds, private.friend_answers,
  private.friend_rate_events from public, anon, authenticated;
revoke all on table public.friend_room_events from public, anon, authenticated;
grant select on table public.friend_room_events to authenticated;

create or replace function private.friend_is_member(p_room_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from private.friend_room_members
    where room_id = p_room_id and user_id = (select auth.uid()) and left_at is null
  )
$$;

revoke all on function private.friend_is_member(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.friend_is_member(uuid) to authenticated;

create policy friend_events_read_members on public.friend_room_events for select to authenticated
  using ((select private.friend_is_member(room_id)));

do $$ begin
  alter publication supabase_realtime add table public.friend_room_events;
exception when duplicate_object then null;
end $$;

create or replace function private.friend_rate_limit(p_user uuid, p_action text, p_limit integer, p_window interval)
returns void language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':' || p_action, 0));
  delete from private.friend_rate_events where user_id = p_user and occurred_at < clock_timestamp() - interval '1 hour';
  select count(*) into v_count from private.friend_rate_events
  where user_id = p_user and action = p_action and occurred_at >= clock_timestamp() - p_window;
  if v_count >= p_limit then
    raise exception 'Too many requests. Please wait a moment and try again.' using errcode = 'P0001';
  end if;
  insert into private.friend_rate_events(user_id, action) values (p_user, p_action);
end;
$$;

create or replace function private.friend_emit(p_room_id uuid, p_kind text)
returns void language sql security definer set search_path = '' as $$
  insert into public.friend_room_events(room_id, kind) values (p_room_id, p_kind)
$$;

create or replace function private.friend_phase(p_starts_at timestamptz, p_now timestamptz)
returns jsonb language plpgsql immutable security invoker set search_path = '' as $$
declare v_elapsed numeric; v_index integer; v_offset numeric;
begin
  if p_now < p_starts_at then
    return jsonb_build_object('phase', 'countdown', 'questionIndex', null,
      'phaseStartsAt', p_starts_at - interval '3 seconds', 'phaseEndsAt', p_starts_at);
  end if;
  v_elapsed := extract(epoch from (p_now - p_starts_at));
  if v_elapsed >= 130 then
    return jsonb_build_object('phase', 'results', 'questionIndex', null,
      'phaseStartsAt', p_starts_at + interval '130 seconds', 'phaseEndsAt', null);
  end if;
  v_index := floor(v_elapsed / 13);
  v_offset := v_elapsed - (v_index * 13);
  if v_offset < 10 then
    return jsonb_build_object('phase', 'question', 'questionIndex', v_index,
      'phaseStartsAt', p_starts_at + make_interval(secs => v_index * 13),
      'phaseEndsAt', p_starts_at + make_interval(secs => v_index * 13 + 10));
  end if;
  return jsonb_build_object('phase', 'reveal', 'questionIndex', v_index,
    'phaseStartsAt', p_starts_at + make_interval(secs => v_index * 13 + 10),
    'phaseEndsAt', p_starts_at + make_interval(secs => v_index * 13 + 13));
end;
$$;

create or replace function private.friend_reconcile(p_room_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_room private.friend_rooms%rowtype; v_match private.friend_matches%rowtype;
begin
  select * into strict v_room from private.friend_rooms where id = p_room_id for update;
  if v_room.status = 'lobby' and clock_timestamp() >= v_room.expires_at then
    update private.friend_rooms set status = 'closed', updated_at = clock_timestamp() where id = p_room_id;
    perform private.friend_emit(p_room_id, 'closed');
    return;
  end if;
  if v_room.status = 'playing' and v_room.current_match_id is not null then
    select * into strict v_match from private.friend_matches where id = v_room.current_match_id for update;
    if clock_timestamp() >= v_match.starts_at + interval '130 seconds' then
      update private.friend_matches set status = 'completed', completed_at = coalesce(completed_at, v_match.starts_at + interval '130 seconds')
      where id = v_match.id;
      update private.friend_rooms set status = 'results', updated_at = clock_timestamp(),
        expires_at = greatest(expires_at, clock_timestamp() + interval '15 minutes') where id = p_room_id;
      perform private.friend_emit(p_room_id, 'phase');
    end if;
  end if;
end;
$$;

create or replace function private.friend_state(p_room_id uuid, p_touch boolean default true)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := private.require_user(); v_room private.friend_rooms%rowtype;
  v_match private.friend_matches%rowtype; v_phase jsonb; v_index smallint;
  v_members jsonb; v_round jsonb; v_standings jsonb; v_answer jsonb;
  v_answer_count integer := 0; v_now timestamptz := clock_timestamp();
begin
  perform private.friend_reconcile(p_room_id);
  select * into strict v_room from private.friend_rooms where id = p_room_id;
  if not exists (select 1 from private.friend_room_members where room_id = p_room_id and user_id = v_user and left_at is null) then
    raise exception 'You are not an active member of this room.' using errcode = '42501';
  end if;
  if p_touch then update private.friend_room_members set last_seen_at = v_now where room_id = p_room_id and user_id = v_user; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'userId', m.user_id, 'displayName', m.display_name, 'avatar', m.avatar,
    'avatarColor', m.avatar_color, 'isReady', m.is_ready,
    'isHost', m.user_id = v_room.host_user_id,
    'isCurrentPlayer', m.user_id = v_user,
    'isConnected', m.last_seen_at >= v_now - interval '45 seconds'
  ) order by m.joined_at), '[]'::jsonb) into v_members
  from private.friend_room_members m where m.room_id = p_room_id and m.left_at is null;

  if v_room.current_match_id is not null then
    select * into strict v_match from private.friend_matches where id = v_room.current_match_id;
    v_phase := private.friend_phase(v_match.starts_at, v_now);
    v_index := (v_phase->>'questionIndex')::smallint;
    if v_index is not null then
      select count(*) into v_answer_count from private.friend_answers
      where match_id = v_match.id and question_index = v_index;
      select jsonb_build_object('choiceId', choice_id, 'isCorrect', is_correct, 'points', points, 'elapsedMs', elapsed_ms)
      into v_answer from private.friend_answers
      where match_id = v_match.id and user_id = v_user and question_index = v_index;
      select jsonb_build_object('index', r.question_index, 'assetKey', r.item_id, 'assetPath', r.asset_path, 'options', r.options)
        || case when v_phase->>'phase' = 'reveal' then jsonb_build_object('correctChoiceId', r.correct_choice_id) else '{}'::jsonb end
      into v_round from private.friend_match_rounds r where r.match_id = v_match.id and r.question_index = v_index;
    end if;
    if v_phase->>'phase' = 'results' or v_room.status = 'results' then
      select coalesce(jsonb_agg(jsonb_build_object(
        'rank', s.rank, 'userId', s.user_id, 'displayName', s.display_name,
        'avatar', s.avatar, 'avatarColor', s.avatar_color, 'score', s.score,
        'correctCount', s.correct_count, 'durationMs', s.duration_ms,
        'isCurrentPlayer', s.user_id = v_user
      ) order by s.rank, s.duration_ms, s.joined_order), '[]'::jsonb) into v_standings
      from (
        select p.*, coalesce(sum(a.points), 0)::integer score,
          count(*) filter (where a.is_correct)::integer correct_count,
          coalesce(sum(a.elapsed_ms), 0)::integer duration_ms,
          rank() over (order by coalesce(sum(a.points), 0) desc, coalesce(sum(a.elapsed_ms), 0) asc) rank
        from private.friend_match_players p
        left join private.friend_answers a on a.match_id = p.match_id and a.user_id = p.user_id
        where p.match_id = v_match.id group by p.match_id, p.user_id, p.display_name, p.avatar, p.avatar_color, p.joined_order
      ) s;
    end if;
  else
    v_phase := jsonb_build_object('phase', case when v_room.status = 'closed' then 'closed' else 'lobby' end,
      'questionIndex', null, 'phaseStartsAt', null, 'phaseEndsAt', null);
  end if;

  return jsonb_build_object(
    'roomId', v_room.id, 'code', v_room.code, 'categoryId', v_room.category_id,
    'status', v_room.status, 'serverNow', v_now, 'expiresAt', v_room.expires_at,
    'hostUserId', v_room.host_user_id, 'isHost', v_room.host_user_id = v_user,
    'members', v_members, 'matchId', v_room.current_match_id,
    'startsAt', v_match.starts_at, 'phase', v_phase->>'phase',
    'questionIndex', v_phase->'questionIndex', 'phaseStartsAt', v_phase->>'phaseStartsAt',
    'phaseEndsAt', v_phase->>'phaseEndsAt', 'round', v_round,
    'answerCount', v_answer_count, 'myAnswer', v_answer, 'standings', v_standings
  );
end;
$$;

create or replace function public.create_friend_room(p_category_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := private.require_user(); v_room uuid; v_code text; v_i integer;
begin
  perform private.friend_rate_limit(v_user, 'create', 5, interval '10 minutes');
  if not exists (select 1 from public.categories where id = p_category_id and is_active) then raise exception 'Unsupported category.'; end if;
  if not exists (select 1 from public.guest_profiles where user_id = v_user) then raise exception 'Profile must be synced first.'; end if;
  loop
    v_code := '';
    for v_i in 1..6 loop v_code := v_code || substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::integer, 1); end loop;
    begin
      insert into private.friend_rooms(code, category_id, host_user_id) values (v_code, p_category_id, v_user) returning id into v_room;
      exit;
    exception when unique_violation then null;
    end;
  end loop;
  insert into private.friend_room_members(room_id, user_id, display_name, avatar, avatar_color)
    select v_room, user_id, display_name, avatar, avatar_color from public.guest_profiles where user_id = v_user;
  perform private.friend_emit(v_room, 'member');
  return private.friend_state(v_room);
end;
$$;

create or replace function public.join_friend_room(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := private.require_user(); v_room private.friend_rooms%rowtype; v_existing boolean;
begin
  perform private.friend_rate_limit(v_user, 'join', 20, interval '5 minutes');
  select * into v_room from private.friend_rooms where code = upper(trim(p_code)) for update;
  if not found then raise exception 'Room not found. Check the code and try again.' using errcode = 'P0001'; end if;
  perform private.friend_reconcile(v_room.id);
  select * into v_room from private.friend_rooms where id = v_room.id for update;
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

create or replace function public.get_friend_room_state(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin return private.friend_state(p_room_id); end;
$$;

create or replace function public.set_friend_ready(p_room_id uuid, p_ready boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := private.require_user();
begin
  perform private.friend_reconcile(p_room_id);
  update private.friend_room_members m set is_ready = p_ready, last_seen_at = clock_timestamp()
  from private.friend_rooms r where m.room_id = p_room_id and m.user_id = v_user and m.left_at is null
    and r.id = p_room_id and r.status = 'lobby';
  if not found then raise exception 'Ready state can only change in the lobby.' using errcode = 'P0001'; end if;
  perform private.friend_emit(p_room_id, 'ready');
  return private.friend_state(p_room_id);
end;
$$;

create or replace function public.start_friend_match(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := private.require_user(); v_room private.friend_rooms%rowtype; v_match uuid;
  v_version text; v_count integer; v_selected record; v_options jsonb; v_correct uuid; v_index smallint := 0;
begin
  select * into strict v_room from private.friend_rooms where id = p_room_id for update;
  if v_room.host_user_id <> v_user then raise exception 'Only the host can start the match.' using errcode = '42501'; end if;
  if v_room.status <> 'lobby' then raise exception 'The match has already started.' using errcode = 'P0001'; end if;
  select count(*) into v_count from private.friend_room_members where room_id = p_room_id and left_at is null;
  if v_count < 2 then raise exception 'At least two players are required.' using errcode = 'P0001'; end if;
  if exists (select 1 from private.friend_room_members where room_id = p_room_id and left_at is null and not is_ready) then
    raise exception 'Everyone must be ready before starting.' using errcode = 'P0001';
  end if;
  select current_content_version into strict v_version from public.categories where id = v_room.category_id and is_active;
  insert into private.friend_matches(room_id, sequence, category_id, content_version, starts_at)
  values (p_room_id, v_room.match_sequence + 1, v_room.category_id, v_version, clock_timestamp() + interval '3 seconds') returning id into v_match;
  insert into private.friend_match_players(match_id, user_id, display_name, avatar, avatar_color, joined_order)
  select v_match, user_id, display_name, avatar, avatar_color, (row_number() over(order by joined_at) - 1)::smallint
  from private.friend_room_members where room_id = p_room_id and left_at is null;
  for v_selected in
    select item_id, display_name, asset_path from private.quiz_content
    where category_id = v_room.category_id and content_version = v_version
    order by md5(v_match::text || ':' || item_id) limit 10
  loop
    with picked as (
      select item_id, display_name from private.quiz_content where content_version = v_version and item_id = v_selected.item_id
      union all
      select item_id, display_name from (
        select item_id, display_name from private.quiz_content where category_id = v_room.category_id and content_version = v_version and item_id <> v_selected.item_id
        order by md5(v_match::text || ':' || v_selected.item_id || ':' || item_id) limit 3
      ) d
    ), tokenized as (
      select item_id, display_name, extensions.gen_random_uuid() choice_id from picked
    )
    select jsonb_agg(jsonb_build_object('id', choice_id, 'label', display_name) order by md5(v_match::text || ':option:' || item_id)),
      (array_agg(choice_id) filter(where item_id = v_selected.item_id))[1]
    into v_options, v_correct from tokenized;
    insert into private.friend_match_rounds(match_id, question_index, item_id, asset_path, options, correct_choice_id)
    values(v_match, v_index, v_selected.item_id, v_selected.asset_path, v_options, v_correct);
    v_index := v_index + 1;
  end loop;
  if v_index <> 10 then raise exception 'Content pack must provide at least ten items.'; end if;
  update private.friend_rooms set status = 'playing', current_match_id = v_match, match_sequence = match_sequence + 1,
    updated_at = clock_timestamp(), expires_at = clock_timestamp() + interval '20 minutes' where id = p_room_id;
  perform private.friend_emit(p_room_id, 'started');
  return private.friend_state(p_room_id);
end;
$$;

create or replace function public.submit_friend_answer(
  p_room_id uuid, p_match_id uuid, p_question_index smallint, p_choice_id uuid, p_request_id uuid
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := private.require_user(); v_room private.friend_rooms%rowtype; v_match private.friend_matches%rowtype;
  v_round private.friend_match_rounds%rowtype; v_phase jsonb; v_elapsed integer; v_correct boolean; v_existing private.friend_answers%rowtype;
begin
  if p_request_id is null then raise exception 'Request ID is required.'; end if;
  select * into strict v_room from private.friend_rooms where id = p_room_id for update;
  if v_room.current_match_id <> p_match_id or v_room.status <> 'playing' then raise exception 'This match is not accepting answers.' using errcode = 'P0001'; end if;
  if not exists(select 1 from private.friend_match_players where match_id = p_match_id and user_id = v_user) then raise exception 'You are not in this match.' using errcode = '42501'; end if;
  if not exists(select 1 from private.friend_room_members where room_id = p_room_id and user_id = v_user and left_at is null) then raise exception 'You have left this room.' using errcode = '42501'; end if;
  select * into v_existing from private.friend_answers where match_id = p_match_id and user_id = v_user and request_id = p_request_id;
  if found then return private.friend_state(p_room_id); end if;
  select * into strict v_match from private.friend_matches where id = p_match_id;
  v_phase := private.friend_phase(v_match.starts_at, clock_timestamp());
  if v_phase->>'phase' <> 'question' or (v_phase->>'questionIndex')::smallint <> p_question_index then
    raise exception 'The answer window for this question is closed.' using errcode = 'P0001';
  end if;
  select * into strict v_round from private.friend_match_rounds where match_id = p_match_id and question_index = p_question_index;
  if p_choice_id is not null and not exists(select 1 from jsonb_array_elements(v_round.options) o where (o->>'id')::uuid = p_choice_id) then
    raise exception 'Invalid answer choice.' using errcode = '22023';
  end if;
  v_elapsed := greatest(0, least(10000, floor(extract(epoch from (clock_timestamp() - v_match.starts_at - make_interval(secs => p_question_index * 13))) * 1000)::integer));
  v_correct := p_choice_id is not null and p_choice_id = v_round.correct_choice_id;
  insert into private.friend_answers(match_id, user_id, question_index, request_id, choice_id, is_correct, points, elapsed_ms)
  values(p_match_id, v_user, p_question_index, p_request_id, p_choice_id, v_correct,
    case when v_correct then greatest(500, 1000 - floor(v_elapsed / 20.0)::integer) else 0 end, v_elapsed)
  on conflict (match_id, user_id, question_index) do nothing;
  if not found then raise exception 'Your answer for this question is already locked.' using errcode = 'P0001'; end if;
  update private.friend_room_members set last_seen_at = clock_timestamp() where room_id = p_room_id and user_id = v_user;
  perform private.friend_emit(p_room_id, 'answer');
  return private.friend_state(p_room_id);
end;
$$;

create or replace function public.leave_friend_room(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := private.require_user(); v_room private.friend_rooms%rowtype; v_next uuid;
begin
  select * into strict v_room from private.friend_rooms where id = p_room_id for update;
  update private.friend_room_members set left_at = clock_timestamp(), is_ready = false where room_id = p_room_id and user_id = v_user and left_at is null;
  if not found then raise exception 'You are not in this room.' using errcode = 'P0001'; end if;
  if not exists(select 1 from private.friend_room_members where room_id = p_room_id and left_at is null) then
    update private.friend_rooms set status = 'closed', updated_at = clock_timestamp() where id = p_room_id;
    perform private.friend_emit(p_room_id, 'closed');
    return jsonb_build_object('left', true, 'roomClosed', true);
  end if;
  if v_room.status = 'lobby' and v_room.host_user_id = v_user then
    select user_id into strict v_next from private.friend_room_members where room_id = p_room_id and left_at is null order by joined_at limit 1;
    update private.friend_rooms set host_user_id = v_next, updated_at = clock_timestamp() where id = p_room_id;
  end if;
  perform private.friend_emit(p_room_id, 'left');
  return jsonb_build_object('left', true, 'roomClosed', false);
end;
$$;

create or replace function public.rematch_friend_room(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := private.require_user(); v_room private.friend_rooms%rowtype;
begin
  perform private.friend_reconcile(p_room_id);
  select * into strict v_room from private.friend_rooms where id = p_room_id for update;
  if v_room.host_user_id <> v_user then raise exception 'Only the host can start a rematch.' using errcode = '42501'; end if;
  if v_room.status <> 'results' then raise exception 'The match is not finished yet.' using errcode = 'P0001'; end if;
  update private.friend_room_members set left_at = clock_timestamp()
  where room_id = p_room_id and user_id <> v_user and left_at is null and last_seen_at < clock_timestamp() - interval '90 seconds';
  update private.friend_room_members set is_ready = false, last_seen_at = case when user_id = v_user then clock_timestamp() else last_seen_at end
  where room_id = p_room_id and left_at is null;
  update private.friend_rooms set status = 'lobby', current_match_id = null, updated_at = clock_timestamp(), expires_at = clock_timestamp() + interval '30 minutes'
  where id = p_room_id;
  perform private.friend_emit(p_room_id, 'rematch');
  return private.friend_state(p_room_id);
end;
$$;

revoke all on function public.create_friend_room(text), public.join_friend_room(text), public.get_friend_room_state(uuid),
  public.set_friend_ready(uuid, boolean), public.start_friend_match(uuid),
  public.submit_friend_answer(uuid, uuid, smallint, uuid, uuid), public.leave_friend_room(uuid),
  public.rematch_friend_room(uuid) from public, anon;
grant execute on function public.create_friend_room(text), public.join_friend_room(text), public.get_friend_room_state(uuid),
  public.set_friend_ready(uuid, boolean), public.start_friend_match(uuid),
  public.submit_friend_answer(uuid, uuid, smallint, uuid, uuid), public.leave_friend_room(uuid),
  public.rematch_friend_room(uuid) to authenticated;

comment on table public.friend_room_events is 'Room-scoped invalidation ticks only; gameplay state and answer keys remain private.';
comment on table private.friend_rooms is 'Private rooms expire after 30 minutes in lobby and 15 minutes after results; state RPCs reconcile expiry.';
