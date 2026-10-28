-- BloopIQ ranked daily challenges.
-- All scoring mutations are performed by authenticated RPCs. Client roles never
-- receive INSERT/UPDATE privileges on attempts or answers.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.categories (
  id text primary key,
  display_name text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint categories_id_format check (id ~ '^[a-z][a-z0-9_-]{1,31}$')
);

create table public.guest_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar text not null,
  avatar_color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_profiles_name_length check (char_length(display_name) between 3 and 40),
  constraint guest_profiles_avatar_length check (char_length(avatar) between 1 and 16),
  constraint guest_profiles_color_format check (avatar_color ~ '^#[0-9A-Fa-f]{6}$')
);

create table private.flag_content (
  content_version text not null,
  question_id text not null,
  display_name text not null,
  asset_key text not null,
  difficulty text not null,
  primary key (content_version, question_id),
  unique (content_version, asset_key),
  constraint flag_content_difficulty check (difficulty in ('easy', 'medium', 'hard'))
);

create table public.daily_challenges (
  id bigint generated always as identity primary key,
  category_id text not null references public.categories(id),
  challenge_date date not null,
  content_version text not null,
  created_at timestamptz not null default now(),
  unique (category_id, challenge_date)
);

create index daily_challenges_category_date_idx
  on public.daily_challenges (category_id, challenge_date desc);

create table private.daily_challenge_rounds (
  challenge_id bigint not null references public.daily_challenges(id) on delete cascade,
  question_index smallint not null,
  round_id uuid not null default extensions.gen_random_uuid(),
  asset_key text not null,
  correct_choice_id uuid not null,
  options jsonb not null,
  primary key (challenge_id, question_index),
  unique (round_id),
  constraint daily_round_index check (question_index between 0 and 9),
  constraint daily_round_four_options check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4)
);

create index daily_challenge_rounds_challenge_idx
  on private.daily_challenge_rounds (challenge_id);

create table public.daily_attempts (
  id uuid primary key default extensions.gen_random_uuid(),
  challenge_id bigint not null references public.daily_challenges(id) on delete restrict,
  category_id text not null references public.categories(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress',
  current_index smallint not null default 0,
  score smallint not null default 0,
  correct_count smallint not null default 0,
  active_duration_ms bigint not null default 0,
  question_started_at timestamptz not null default clock_timestamp(),
  started_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp() + interval '30 minutes'),
  completed_at timestamptz,
  constraint daily_attempt_status check (status in ('in_progress', 'completed', 'expired')),
  constraint daily_attempt_index check (current_index between 0 and 10),
  constraint daily_attempt_score check (score between 0 and 1000 and score % 100 = 0),
  constraint daily_attempt_correct check (correct_count between 0 and 10),
  constraint daily_attempt_duration check (active_duration_ms between 0 and 100000),
  unique (challenge_id, user_id)
);

create unique index daily_attempts_one_active_category_idx
  on public.daily_attempts (user_id, category_id)
  where status = 'in_progress';
create index daily_attempts_user_category_idx
  on public.daily_attempts (user_id, category_id, started_at desc);
create index daily_attempts_challenge_rank_idx
  on public.daily_attempts (challenge_id, score desc, active_duration_ms asc)
  where status = 'completed';
create index daily_attempts_weekly_rank_idx
  on public.daily_attempts (category_id, completed_at, user_id)
  where status = 'completed';

create table public.daily_answers (
  id bigint generated always as identity primary key,
  attempt_id uuid not null references public.daily_attempts(id) on delete cascade,
  question_index smallint not null,
  request_id uuid not null,
  choice_id uuid,
  is_correct boolean not null,
  points smallint not null,
  elapsed_ms integer not null,
  answered_at timestamptz not null default clock_timestamp(),
  unique (attempt_id, question_index),
  unique (attempt_id, request_id),
  constraint daily_answer_index check (question_index between 0 and 9),
  constraint daily_answer_points check (points in (0, 100)),
  constraint daily_answer_elapsed check (elapsed_ms between 0 and 10000)
);

create index daily_answers_attempt_idx on public.daily_answers (attempt_id);

insert into public.categories (id, display_name, is_active)
values ('flags', 'Flags', true)
on conflict (id) do update set display_name = excluded.display_name, is_active = excluded.is_active;

insert into private.flag_content (content_version, question_id, display_name, asset_key, difficulty) values
  ('flags-v1', 'flag-ar', 'Argentina', 'ar', 'easy'),
  ('flags-v1', 'flag-au', 'Australia', 'au', 'easy'),
  ('flags-v1', 'flag-at', 'Austria', 'at', 'medium'),
  ('flags-v1', 'flag-be', 'Belgium', 'be', 'medium'),
  ('flags-v1', 'flag-br', 'Brazil', 'br', 'easy'),
  ('flags-v1', 'flag-ca', 'Canada', 'ca', 'easy'),
  ('flags-v1', 'flag-cl', 'Chile', 'cl', 'medium'),
  ('flags-v1', 'flag-cn', 'China', 'cn', 'easy'),
  ('flags-v1', 'flag-co', 'Colombia', 'co', 'medium'),
  ('flags-v1', 'flag-hr', 'Croatia', 'hr', 'hard'),
  ('flags-v1', 'flag-cz', 'Czechia', 'cz', 'hard'),
  ('flags-v1', 'flag-dk', 'Denmark', 'dk', 'medium'),
  ('flags-v1', 'flag-eg', 'Egypt', 'eg', 'medium'),
  ('flags-v1', 'flag-fi', 'Finland', 'fi', 'medium'),
  ('flags-v1', 'flag-fr', 'France', 'fr', 'easy'),
  ('flags-v1', 'flag-de', 'Germany', 'de', 'easy'),
  ('flags-v1', 'flag-gr', 'Greece', 'gr', 'medium'),
  ('flags-v1', 'flag-hu', 'Hungary', 'hu', 'hard'),
  ('flags-v1', 'flag-is', 'Iceland', 'is', 'hard'),
  ('flags-v1', 'flag-in', 'India', 'in', 'easy'),
  ('flags-v1', 'flag-id', 'Indonesia', 'id', 'hard'),
  ('flags-v1', 'flag-ie', 'Ireland', 'ie', 'hard'),
  ('flags-v1', 'flag-it', 'Italy', 'it', 'easy'),
  ('flags-v1', 'flag-jp', 'Japan', 'jp', 'easy'),
  ('flags-v1', 'flag-mx', 'Mexico', 'mx', 'easy'),
  ('flags-v1', 'flag-ma', 'Morocco', 'ma', 'medium'),
  ('flags-v1', 'flag-nl', 'Netherlands', 'nl', 'medium'),
  ('flags-v1', 'flag-nz', 'New Zealand', 'nz', 'medium'),
  ('flags-v1', 'flag-ng', 'Nigeria', 'ng', 'medium'),
  ('flags-v1', 'flag-no', 'Norway', 'no', 'medium'),
  ('flags-v1', 'flag-pl', 'Poland', 'pl', 'medium'),
  ('flags-v1', 'flag-pt', 'Portugal', 'pt', 'medium'),
  ('flags-v1', 'flag-ro', 'Romania', 'ro', 'hard'),
  ('flags-v1', 'flag-sa', 'Saudi Arabia', 'sa', 'medium'),
  ('flags-v1', 'flag-za', 'South Africa', 'za', 'medium'),
  ('flags-v1', 'flag-kr', 'South Korea', 'kr', 'easy'),
  ('flags-v1', 'flag-es', 'Spain', 'es', 'easy'),
  ('flags-v1', 'flag-se', 'Sweden', 'se', 'medium'),
  ('flags-v1', 'flag-ch', 'Switzerland', 'ch', 'medium'),
  ('flags-v1', 'flag-th', 'Thailand', 'th', 'medium'),
  ('flags-v1', 'flag-tr', 'Türkiye', 'tr', 'medium'),
  ('flags-v1', 'flag-ua', 'Ukraine', 'ua', 'medium'),
  ('flags-v1', 'flag-gb', 'United Kingdom', 'gb', 'easy'),
  ('flags-v1', 'flag-us', 'United States', 'us', 'easy'),
  ('flags-v1', 'flag-vn', 'Vietnam', 'vn', 'medium'),
  ('flags-v1', 'flag-gh', 'Ghana', 'gh', 'hard'),
  ('flags-v1', 'flag-ke', 'Kenya', 'ke', 'hard'),
  ('flags-v1', 'flag-pe', 'Peru', 'pe', 'hard');

alter table public.categories enable row level security;
alter table public.guest_profiles enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.daily_attempts enable row level security;
alter table public.daily_answers enable row level security;

create policy categories_read on public.categories for select to authenticated using (true);
create policy profiles_read_own on public.guest_profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy profiles_insert_own on public.guest_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy profiles_update_own on public.guest_profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy challenges_read on public.daily_challenges for select to authenticated using (true);
create policy attempts_read_own on public.daily_attempts for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.categories, public.guest_profiles, public.daily_challenges, public.daily_attempts, public.daily_answers from anon, authenticated;
grant select on public.categories, public.daily_challenges to authenticated;
grant select, insert, update on public.guest_profiles to authenticated;
grant select on public.daily_attempts to authenticated;

create or replace function private.require_user()
returns uuid language plpgsql stable security invoker set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'authentication required' using errcode = '28000'; end if;
  return v_user;
end;
$$;

create or replace function private.utc_today()
returns date language sql stable security invoker set search_path = ''
as $$ select (now() at time zone 'utc')::date $$;

create or replace function private.next_utc_reset()
returns timestamptz language sql stable security invoker set search_path = ''
as $$ select ((now() at time zone 'utc')::date + 1)::timestamp at time zone 'utc' $$;

create or replace function private.ensure_daily_challenge(p_category_id text, p_date date)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_challenge_id bigint;
  v_index smallint := 0;
  v_selected record;
  v_options jsonb;
  v_correct_choice uuid;
begin
  if p_category_id <> 'flags' then raise exception 'unsupported category'; end if;
  perform pg_advisory_xact_lock(hashtextextended('bloopiq:' || p_category_id || ':' || p_date::text, 0));

  insert into public.daily_challenges (category_id, challenge_date, content_version)
  values (p_category_id, p_date, 'flags-v1')
  on conflict (category_id, challenge_date) do nothing;

  select id into strict v_challenge_id from public.daily_challenges
  where category_id = p_category_id and challenge_date = p_date;

  if not exists (select 1 from private.daily_challenge_rounds where challenge_id = v_challenge_id) then
    for v_selected in
      select question_id, display_name, asset_key
      from private.flag_content
      where content_version = 'flags-v1'
      order by md5(p_date::text || ':' || question_id)
      limit 10
    loop
      with picked as (
        select question_id, display_name
        from private.flag_content
        where content_version = 'flags-v1' and question_id = v_selected.question_id
        union all
        select question_id, display_name
        from (
          select question_id, display_name
          from private.flag_content
          where content_version = 'flags-v1' and question_id <> v_selected.question_id
          order by md5(p_date::text || ':' || v_selected.question_id || ':' || question_id)
          limit 3
        ) distractors
      ), tokenized as (
        select question_id, display_name, extensions.gen_random_uuid() as choice_id
        from picked
      )
      select
        jsonb_agg(jsonb_build_object('id', choice_id, 'label', display_name)
          order by md5(p_date::text || ':option:' || v_selected.question_id || ':' || question_id)),
        (array_agg(choice_id) filter (where question_id = v_selected.question_id))[1]
      into v_options, v_correct_choice
      from tokenized;

      insert into private.daily_challenge_rounds
        (challenge_id, question_index, asset_key, correct_choice_id, options)
      values (v_challenge_id, v_index, v_selected.asset_key, v_correct_choice, v_options);
      v_index := v_index + 1;
    end loop;
  end if;
  return v_challenge_id;
end;
$$;

create or replace function private.round_json(p_challenge_id bigint, p_index smallint)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'index', question_index,
    'roundId', round_id,
    'assetKey', asset_key,
    'options', options
  )
  from private.daily_challenge_rounds
  where challenge_id = p_challenge_id and question_index = p_index
$$;

create or replace function private.daily_streak(p_user_id uuid, p_category_id text)
returns integer language plpgsql stable security definer set search_path = '' as $$
declare
  v_day date := private.utc_today();
  v_streak integer := 0;
begin
  if not exists (
    select 1 from public.daily_attempts a join public.daily_challenges c on c.id = a.challenge_id
    where a.user_id = p_user_id and a.category_id = p_category_id and a.status = 'completed' and c.challenge_date = v_day
  ) then v_day := v_day - 1; end if;
  loop
    exit when not exists (
      select 1 from public.daily_attempts a join public.daily_challenges c on c.id = a.challenge_id
      where a.user_id = p_user_id and a.category_id = p_category_id and a.status = 'completed' and c.challenge_date = v_day
    );
    v_streak := v_streak + 1;
    v_day := v_day - 1;
  end loop;
  return v_streak;
end;
$$;

create or replace function private.advance_expired_question(p_attempt_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_attempt public.daily_attempts%rowtype;
begin
  select * into v_attempt from public.daily_attempts where id = p_attempt_id for update;
  if v_attempt.status <> 'in_progress' then return; end if;
  if clock_timestamp() >= v_attempt.expires_at then
    update public.daily_attempts set status = 'expired', completed_at = clock_timestamp() where id = p_attempt_id;
    return;
  end if;
  if clock_timestamp() < v_attempt.question_started_at + interval '10 seconds' then return; end if;

  insert into public.daily_answers
    (attempt_id, question_index, request_id, choice_id, is_correct, points, elapsed_ms)
  values (p_attempt_id, v_attempt.current_index, extensions.gen_random_uuid(), null, false, 0, 10000)
  on conflict (attempt_id, question_index) do nothing;

  if v_attempt.current_index = 9 then
    update public.daily_attempts set status = 'completed', current_index = 10,
      active_duration_ms = active_duration_ms + 10000, completed_at = clock_timestamp()
    where id = p_attempt_id and status = 'in_progress';
  else
    update public.daily_attempts set current_index = current_index + 1,
      active_duration_ms = active_duration_ms + 10000, question_started_at = clock_timestamp() + interval '750 milliseconds'
    where id = p_attempt_id and status = 'in_progress';
  end if;
end;
$$;

create or replace function private.attempt_state(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_attempt public.daily_attempts%rowtype;
  v_challenge public.daily_challenges%rowtype;
  v_rank bigint;
  v_practice jsonb;
begin
  select * into strict v_attempt from public.daily_attempts where id = p_attempt_id;
  select * into strict v_challenge from public.daily_challenges where id = v_attempt.challenge_id;
  if v_attempt.status = 'completed' then
    select position into v_rank from (
      select user_id, rank() over (order by score desc, active_duration_ms asc) as position
      from public.daily_attempts where challenge_id = v_attempt.challenge_id and status = 'completed'
    ) ranked where user_id = v_attempt.user_id;
    select coalesce(jsonb_agg(private.round_json(v_attempt.challenge_id, r.question_index) order by r.question_index), '[]'::jsonb)
      into v_practice from private.daily_challenge_rounds r where r.challenge_id = v_attempt.challenge_id;
  end if;
  return jsonb_build_object(
    'state', v_attempt.status,
    'attemptId', v_attempt.id,
    'challengeDate', v_challenge.challenge_date,
    'contentVersion', v_challenge.content_version,
    'serverNow', clock_timestamp(),
    'resetAt', private.next_utc_reset(),
    'expiresAt', v_attempt.expires_at,
    'questionIndex', v_attempt.current_index,
    'questionStartedAt', v_attempt.question_started_at,
    'questionDeadlineAt', v_attempt.question_started_at + interval '10 seconds',
    'score', v_attempt.score,
    'correctCount', v_attempt.correct_count,
    'answeredCount', v_attempt.current_index,
    'dailyStreak', private.daily_streak(v_attempt.user_id, v_attempt.category_id),
    'rank', v_rank,
    'currentRound', case when v_attempt.status = 'in_progress' then private.round_json(v_attempt.challenge_id, v_attempt.current_index) else null end,
    'practiceRounds', v_practice
  );
end;
$$;

create or replace function public.sync_guest_profile(p_display_name text, p_avatar text, p_avatar_color text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := private.require_user(); v_profile public.guest_profiles%rowtype;
begin
  if char_length(p_display_name) not between 3 and 40 or char_length(p_avatar) not between 1 and 16 or p_avatar_color !~ '^#[0-9A-Fa-f]{6}$' then
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

create or replace function public.get_daily_state(p_category_id text default 'flags')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := private.require_user();
  v_challenge_id bigint;
  v_attempt_id uuid;
begin
  v_challenge_id := private.ensure_daily_challenge(p_category_id, private.utc_today());
  select id into v_attempt_id from public.daily_attempts
  where user_id = v_user and category_id = p_category_id and status = 'in_progress'
  order by started_at desc limit 1 for update;
  if v_attempt_id is not null then
    perform private.advance_expired_question(v_attempt_id);
    if exists (select 1 from public.daily_attempts where id = v_attempt_id and status = 'in_progress') then
      return private.attempt_state(v_attempt_id);
    end if;
  end if;
  select id into v_attempt_id from public.daily_attempts
  where user_id = v_user and challenge_id = v_challenge_id;
  if v_attempt_id is not null then return private.attempt_state(v_attempt_id); end if;
  return jsonb_build_object(
    'state', 'not_started', 'challengeDate', private.utc_today(), 'contentVersion', 'flags-v1',
    'serverNow', clock_timestamp(), 'resetAt', private.next_utc_reset(),
    'score', 0, 'correctCount', 0, 'answeredCount', 0,
    'dailyStreak', private.daily_streak(v_user, p_category_id)
  );
end;
$$;

create or replace function public.start_daily_attempt(p_category_id text default 'flags')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := private.require_user(); v_challenge_id bigint; v_attempt_id uuid;
begin
  select id into v_attempt_id from public.daily_attempts
  where user_id = v_user and category_id = p_category_id and status = 'in_progress'
  order by started_at desc limit 1 for update;
  if v_attempt_id is not null then
    perform private.advance_expired_question(v_attempt_id);
    if exists (select 1 from public.daily_attempts where id = v_attempt_id and status = 'in_progress') then
      return private.attempt_state(v_attempt_id);
    end if;
  end if;

  v_challenge_id := private.ensure_daily_challenge(p_category_id, private.utc_today());
  insert into public.daily_attempts (challenge_id, category_id, user_id)
  values (v_challenge_id, p_category_id, v_user)
  on conflict (challenge_id, user_id) do nothing;
  select id into strict v_attempt_id from public.daily_attempts
  where challenge_id = v_challenge_id and user_id = v_user;
  return private.attempt_state(v_attempt_id);
end;
$$;

create or replace function public.submit_daily_answer(
  p_attempt_id uuid,
  p_question_index smallint,
  p_choice_id uuid,
  p_request_id uuid
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := private.require_user();
  v_attempt public.daily_attempts%rowtype;
  v_round private.daily_challenge_rounds%rowtype;
  v_existing public.daily_answers%rowtype;
  v_elapsed bigint;
  v_correct boolean;
begin
  if p_request_id is null then raise exception 'request id required'; end if;
  select * into strict v_attempt from public.daily_attempts
  where id = p_attempt_id and user_id = v_user for update;

  select * into v_existing from public.daily_answers
  where attempt_id = p_attempt_id and request_id = p_request_id;
  if found then
    return private.attempt_state(p_attempt_id) || jsonb_build_object(
      'lastAnswer', jsonb_build_object(
        'questionIndex', v_existing.question_index,
        'isCorrect', v_existing.is_correct,
        'points', v_existing.points
      )
    );
  end if;
  if v_attempt.status <> 'in_progress' then return private.attempt_state(p_attempt_id); end if;
  if clock_timestamp() >= v_attempt.expires_at then
    update public.daily_attempts set status = 'expired', completed_at = clock_timestamp() where id = p_attempt_id;
    return private.attempt_state(p_attempt_id);
  end if;
  if p_question_index <> v_attempt.current_index then raise exception 'unexpected question index' using errcode = '22023'; end if;
  select * into strict v_round from private.daily_challenge_rounds
  where challenge_id = v_attempt.challenge_id and question_index = v_attempt.current_index;
  if p_choice_id is not null and not exists (
    select 1 from jsonb_array_elements(v_round.options) option where (option->>'id')::uuid = p_choice_id
  ) then raise exception 'invalid choice' using errcode = '22023'; end if;

  v_elapsed := greatest(0, floor(extract(epoch from (clock_timestamp() - v_attempt.question_started_at)) * 1000)::bigint);
  v_correct := p_choice_id is not null and p_choice_id = v_round.correct_choice_id and v_elapsed <= 10000;

  insert into public.daily_answers
    (attempt_id, question_index, request_id, choice_id, is_correct, points, elapsed_ms)
  values (p_attempt_id, p_question_index, p_request_id, p_choice_id, v_correct,
    case when v_correct then 100 else 0 end, least(v_elapsed, 10000)::integer);

  if v_attempt.current_index = 9 then
    update public.daily_attempts set status = 'completed', current_index = 10,
      score = score + case when v_correct then 100 else 0 end,
      correct_count = correct_count + case when v_correct then 1 else 0 end,
      active_duration_ms = active_duration_ms + least(v_elapsed, 10000),
      completed_at = clock_timestamp()
    where id = p_attempt_id and status = 'in_progress';
  else
    update public.daily_attempts set current_index = current_index + 1,
      score = score + case when v_correct then 100 else 0 end,
      correct_count = correct_count + case when v_correct then 1 else 0 end,
      active_duration_ms = active_duration_ms + least(v_elapsed, 10000),
      question_started_at = clock_timestamp() + interval '750 milliseconds'
    where id = p_attempt_id and status = 'in_progress';
  end if;
  return private.attempt_state(p_attempt_id) || jsonb_build_object(
    'lastAnswer', jsonb_build_object(
      'questionIndex', p_question_index,
      'isCorrect', v_correct,
      'points', case when v_correct then 100 else 0 end
    )
  );
end;
$$;

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
      select * from ranked where position <= p_limit or user_id = v_user
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'position', c.position, 'displayName', coalesce(p.display_name, 'Guest Player'),
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
    select * from ranked where position <= p_limit or user_id = v_user
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'position', c.position, 'displayName', coalesce(p.display_name, 'Guest Player'),
    'avatar', coalesce(p.avatar, '●'), 'avatarColor', coalesce(p.avatar_color, '#2D9CDB'),
    'score', c.score, 'durationMs', c.duration_ms, 'isCurrentPlayer', c.user_id = v_user
  ) order by c.position, c.duration_ms), '[]'::jsonb)
  into v_entries from chosen c left join public.guest_profiles p on p.user_id = c.user_id;
  return jsonb_build_object('period', 'week', 'categoryId', p_category_id,
    'boundaryStart', v_week_start, 'boundaryEnd', v_week_start + 7, 'entries', v_entries);
end;
$$;

revoke all on function public.sync_guest_profile(text, text, text) from public, anon;
revoke all on function public.get_daily_state(text) from public, anon;
revoke all on function public.start_daily_attempt(text) from public, anon;
revoke all on function public.submit_daily_answer(uuid, smallint, uuid, uuid) from public, anon;
revoke all on function public.get_leaderboard(text, text, integer) from public, anon;
grant execute on function public.sync_guest_profile(text, text, text) to authenticated;
grant execute on function public.get_daily_state(text) to authenticated;
grant execute on function public.start_daily_attempt(text) to authenticated;
grant execute on function public.submit_daily_answer(uuid, smallint, uuid, uuid) to authenticated;
grant execute on function public.get_leaderboard(text, text, integer) to authenticated;

revoke all on all functions in schema private from public, anon, authenticated;
