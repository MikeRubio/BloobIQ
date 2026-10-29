-- Separate non-revealing question symbols from complete reveal artwork.
-- Existing assets remain immutable; football-symbols-v2 is the new active pack.

alter table private.quiz_content add column reveal_asset_path text;
update private.quiz_content set reveal_asset_path = asset_path;
alter table private.quiz_content alter column reveal_asset_path set not null;
alter table private.quiz_content add constraint quiz_content_reveal_asset_path_format
  check (reveal_asset_path ~ '^[a-z0-9][a-z0-9._/-]{1,199}$');

alter table private.daily_challenge_rounds add column reveal_asset_path text;
update private.daily_challenge_rounds r
set reveal_asset_path = q.asset_path
from public.daily_challenges c
join private.quiz_content q
  on q.content_version = c.content_version
where c.id = r.challenge_id and q.item_id = r.asset_key;
alter table private.daily_challenge_rounds alter column reveal_asset_path set not null;
alter table private.daily_challenge_rounds add constraint daily_round_reveal_asset_path_format
  check (reveal_asset_path ~ '^[a-z0-9][a-z0-9._/-]{1,199}$');

alter table private.friend_match_rounds add column reveal_asset_path text;
update private.friend_match_rounds r
set reveal_asset_path = q.asset_path
from private.friend_matches m
join private.quiz_content q
  on q.content_version = m.content_version
where m.id = r.match_id and q.item_id = r.item_id;
alter table private.friend_match_rounds alter column reveal_asset_path set not null;
alter table private.friend_match_rounds add constraint friend_round_reveal_asset_path_format
  check (reveal_asset_path ~ '^[a-z0-9][a-z0-9._/-]{1,199}$');

insert into private.quiz_content
  (category_id, content_version, item_id, display_name, asset_path, reveal_asset_path,
   asset_sha256, source_page_url, source_asset_url, rights_status, attribution, difficulty, metadata)
values
  ('football', 'football-symbols-v2', 'football-uefa', 'UEFA', 'football-symbols-v2/q-01.svg', 'football-v1/uefa.png', 'b55355911e48a7253a857439a4bd0eee0771359ed848003e94d2b859593e8259', 'https://en.wikipedia.org/wiki/UEFA', 'https://thumb.wikimedia.org/wikipedia/en/thumb/9/9d/UEFA_full_logo.svg/330px-UEFA_full_logo.svg.png', 'trademark_reviewed_approved', 'Trademark use reviewed and approved by project owner for pre-production quiz use (2026-10-28)', 'easy', '{"scope":"confederation","distractorIds":["football-caf","football-concacaf","football-conmebol"],"questionAssetRole":"symbol_only_quiz_variant","revealAssetRole":"complete_original_identity","editRecipe":"Remove both outlined UEFA lettering paths and crop to the central striped globe."}'::jsonb),
  ('football', 'football-symbols-v2', 'football-caf', 'CAF', 'football-symbols-v2/q-02.svg', 'football-v1/caf.png', '0ef033466d8e371f339f7c75856fb1364310dbab41ed0627729a1b98a8c0ff10', 'https://en.wikipedia.org/wiki/Confederation_of_African_Football', 'https://thumb.wikimedia.org/wikipedia/en/thumb/7/72/Confederation_of_African_Football_logo.svg/330px-Confederation_of_African_Football_logo.svg.png', 'trademark_reviewed_approved', 'Trademark use reviewed and approved by project owner for pre-production quiz use (2026-10-28)', 'medium', '{"scope":"confederation","distractorIds":["football-uefa","football-concacaf","football-conmebol"],"questionAssetRole":"symbol_only_quiz_variant","revealAssetRole":"complete_original_identity","editRecipe":"Remove the final four outlined CAF and registration-mark paths, then crop to the globe-and-continent crest."}'::jsonb),
  ('football', 'football-symbols-v2', 'football-concacaf', 'CONCACAF', 'football-symbols-v2/q-03.svg', 'football-v1/concacaf.png', '04f49b16486c34e47aa884b333b5a7678dd1865808d73bf26d70a915dca8ca6b', 'https://en.wikipedia.org/wiki/CONCACAF', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Concacaf_logo.svg/500px-Concacaf_logo.svg.png', 'trademark_reviewed_approved', 'Trademark use reviewed and approved by project owner for pre-production quiz use (2026-10-28)', 'medium', '{"scope":"confederation","distractorIds":["football-uefa","football-caf","football-conmebol"],"questionAssetRole":"symbol_only_quiz_variant","revealAssetRole":"complete_original_identity","editRecipe":"Remove the outlined wordmark group and retain the official gold radial symbol."}'::jsonb),
  ('football', 'football-symbols-v2', 'football-conmebol', 'CONMEBOL', 'football-symbols-v2/q-04.svg', 'football-v1/conmebol.png', '08a7f2f0334640959085df7e38d9cbc994687a423e3729c74fb7dde5f5892a60', 'https://en.wikipedia.org/wiki/CONMEBOL', 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/a8/CONMEBOL_logo_%282017%29.svg/500px-CONMEBOL_logo_%282017%29.svg.png', 'trademark_reviewed_approved', 'Trademark use reviewed and approved by project owner for pre-production quiz use (2026-10-28)', 'medium', '{"scope":"confederation","distractorIds":["football-uefa","football-caf","football-concacaf"],"questionAssetRole":"symbol_only_quiz_variant","revealAssetRole":"complete_original_identity","editRecipe":"Crop to the shield-and-continent crest above the outlined CONMEBOL wordmark."}'::jsonb),
  ('football', 'football-symbols-v2', 'football-premier-league', 'English Premier League', 'football-symbols-v2/q-05.svg', 'football-v1/premier-league.png', 'c76751cf5fc603db12d56608b726c77c435a94c0ac6dbcaf177c63e9997d838f', 'https://en.wikipedia.org/wiki/Premier_League', 'https://thumb.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/500px-Premier_League_Logo.svg.png', 'trademark_reviewed_approved', 'Trademark use reviewed and approved by project owner for pre-production quiz use (2026-10-28)', 'easy', '{"scope":"league","distractorIds":["football-la-liga","football-bundesliga","football-major-league-soccer","football-brasileirao-serie-a","football-saudi-pro-league"],"questionAssetRole":"symbol_only_quiz_variant","revealAssetRole":"complete_original_identity","editRecipe":"Crop to the crowned lion symbol left of the outlined Premier League wordmark."}'::jsonb),
  ('football', 'football-symbols-v2', 'football-la-liga', 'La Liga', 'football-symbols-v2/q-06.svg', 'football-v1/la-liga.png', '60cdad81dccd059da12d97df2c7bede2238b14ad5b176a7e917b1f2c98292163', 'https://en.wikipedia.org/wiki/La_Liga', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/LaLiga_EA_Sports_2023_Vertical_Logo.svg/500px-LaLiga_EA_Sports_2023_Vertical_Logo.svg.png', 'trademark_reviewed_approved', 'Trademark use reviewed and approved by project owner for pre-production quiz use (2026-10-28)', 'easy', '{"scope":"league","distractorIds":["football-premier-league","football-bundesliga","football-major-league-soccer","football-brasileirao-serie-a","football-saudi-pro-league"],"questionAssetRole":"symbol_only_quiz_variant","revealAssetRole":"complete_original_identity","editRecipe":"Crop to the red geometric competition symbol above the outlined LaLiga and sponsor wordmarks."}'::jsonb),
  ('football', 'football-symbols-v2', 'football-bundesliga', 'Bundesliga', 'football-symbols-v2/q-07.svg', 'football-v1/bundesliga.png', '1e9221a6510a502f182423553642bb4f342e3cd7c31a0e3ee35dc68d24db04eb', 'https://en.wikipedia.org/wiki/Bundesliga', 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/df/Bundesliga_logo_%282017%29.svg/500px-Bundesliga_logo_%282017%29.svg.png', 'trademark_reviewed_approved', 'Trademark use reviewed and approved by project owner for pre-production quiz use (2026-10-28)', 'easy', '{"scope":"league","distractorIds":["football-premier-league","football-la-liga","football-major-league-soccer","football-brasileirao-serie-a","football-saudi-pro-league"],"questionAssetRole":"symbol_only_quiz_variant","revealAssetRole":"complete_original_identity","editRecipe":"Remove the final outlined BUNDESLIGA lettering path and retain the red player-and-ball panel."}'::jsonb),
  ('football', 'football-symbols-v2', 'football-major-league-soccer', 'Major League Soccer', 'football-symbols-v2/q-08.svg', 'football-v1/major-league-soccer.png', 'f8501297087f933c6bab87c4fa986ce85dea1782e0b17f08d67806367112ee80', 'https://en.wikipedia.org/wiki/Major_League_Soccer', 'https://thumb.wikimedia.org/wikipedia/en/thumb/c/c7/Major_League_Soccer_logo.svg/500px-Major_League_Soccer_logo.svg.png', 'trademark_reviewed_approved', 'Trademark use reviewed and approved by project owner for pre-production quiz use (2026-10-28)', 'medium', '{"scope":"league","distractorIds":["football-premier-league","football-la-liga","football-bundesliga","football-brasileirao-serie-a","football-saudi-pro-league"],"questionAssetRole":"symbol_only_quiz_variant","revealAssetRole":"complete_original_identity","editRecipe":"Remove the outlined MLS acronym and trademark paths while preserving the official shield, slash, and stars."}'::jsonb),
  ('football', 'football-symbols-v2', 'football-brasileirao-serie-a', 'Brasileirão Série A', 'football-symbols-v2/q-09.svg', 'football-v1/brasileirao-serie-a.png', 'c2ffdf7890c777e64633a1e87309b4b117deffbc588866debb32d64a587f661d', 'https://en.wikipedia.org/wiki/Campeonato_Brasileiro_S%C3%A9rie_A', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/Campeonato_Brasileiro_S%C3%A9rie_A_logo_%282024%29.svg/500px-Campeonato_Brasileiro_S%C3%A9rie_A_logo_%282024%29.svg.png', 'trademark_reviewed_approved', 'Trademark use reviewed and approved by project owner for pre-production quiz use (2026-10-28)', 'medium', '{"scope":"league","distractorIds":["football-premier-league","football-la-liga","football-bundesliga","football-major-league-soccer","football-saudi-pro-league"],"questionAssetRole":"symbol_only_quiz_variant","revealAssetRole":"complete_original_identity","editRecipe":"Crop to the trophy-and-ball symbol above the outlined Brasileirão and sponsor wordmarks."}'::jsonb),
  ('football', 'football-symbols-v2', 'football-saudi-pro-league', 'Saudi Pro League', 'football-symbols-v2/q-10.svg', 'football-v1/saudi-pro-league.png', '5d9fc0bc33e8a52ef03ae994f5e3bbde81c49b504a9c762639f58e97f9c92053', 'https://commons.wikimedia.org/wiki/File:Saudi_Pro_League_Logo.svg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/Saudi_Pro_League_Logo.svg/500px-Saudi_Pro_League_Logo.svg.png', 'trademark_reviewed_approved', 'Trademark use reviewed and approved by project owner for pre-production quiz use (2026-10-28)', 'medium', '{"scope":"league","distractorIds":["football-premier-league","football-la-liga","football-bundesliga","football-major-league-soccer","football-brasileirao-serie-a"],"questionAssetRole":"symbol_only_quiz_variant","revealAssetRole":"complete_original_identity","editRecipe":"Use the original raster artwork and deterministically make black lettering transparent, preserving the multicolor league symbol."}'::jsonb);

update public.categories
set current_content_version = 'football-symbols-v2'
where id = 'football';

-- Allow today's unplayed challenge to be rebuilt from the corrected pack while
-- preserving every challenge that already has an attempt.
delete from public.daily_challenges c
where c.category_id = 'football'
  and c.challenge_date = private.utc_today()
  and not exists (select 1 from public.daily_attempts a where a.challenge_id = c.id);

create or replace function private.quiz_options(p_content_version text, p_item_id text, p_seed text)
returns jsonb language sql volatile security definer set search_path = '' as $$
  with correct_item as (
    select item_id, display_name, metadata->>'scope' as scope
    from private.quiz_content
    where content_version = p_content_version and item_id = p_item_id
  ), distractors as (
    select q.item_id, q.display_name,
      case when q.metadata->>'scope' = c.scope then 0 else 1 end as scope_order
    from private.quiz_content q cross join correct_item c
    where q.content_version = p_content_version and q.item_id <> p_item_id
    order by scope_order, md5(p_seed || ':' || q.item_id)
    limit 3
  ), picked as (
    select item_id, display_name from correct_item
    union all
    select item_id, display_name from distractors
  ), tokenized as (
    select item_id, display_name, extensions.gen_random_uuid() as choice_id
    from picked
  )
  select jsonb_build_object(
    'options', jsonb_agg(jsonb_build_object('id', choice_id, 'label', display_name)
      order by md5(p_seed || ':option:' || item_id)),
    'correctChoiceId', (array_agg(choice_id) filter (where item_id = p_item_id))[1]
  )
  from tokenized
$$;

create or replace function private.ensure_daily_challenge(p_category_id text, p_date date)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_challenge_id bigint;
  v_content_version text;
  v_index smallint := 0;
  v_selected record;
  v_choice_pack jsonb;
begin
  select current_content_version into v_content_version
  from public.categories where id = p_category_id and is_active;
  if not found then raise exception 'unsupported category'; end if;

  perform pg_advisory_xact_lock(hashtextextended('bloopiq:' || p_category_id || ':' || p_date::text, 0));
  insert into public.daily_challenges (category_id, challenge_date, content_version)
  values (p_category_id, p_date, v_content_version)
  on conflict (category_id, challenge_date) do nothing;

  select id, content_version into strict v_challenge_id, v_content_version
  from public.daily_challenges where category_id = p_category_id and challenge_date = p_date;

  if not exists (select 1 from private.daily_challenge_rounds where challenge_id = v_challenge_id) then
    for v_selected in
      select item_id, asset_path, reveal_asset_path
      from private.quiz_content
      where category_id = p_category_id and content_version = v_content_version
      order by md5(p_date::text || ':' || item_id)
      limit 10
    loop
      v_choice_pack := private.quiz_options(v_content_version, v_selected.item_id, p_date::text || ':' || v_selected.item_id);
      if jsonb_array_length(v_choice_pack->'options') <> 4 then raise exception 'content pack must provide four options'; end if;
      insert into private.daily_challenge_rounds
        (challenge_id, question_index, asset_key, asset_path, reveal_asset_path, correct_choice_id, options)
      values (
        v_challenge_id, v_index, v_selected.item_id, v_selected.asset_path, v_selected.reveal_asset_path,
        (v_choice_pack->>'correctChoiceId')::uuid, v_choice_pack->'options'
      );
      v_index := v_index + 1;
    end loop;
    if v_index <> 10 then raise exception 'content pack must provide at least 10 items'; end if;
  end if;
  return v_challenge_id;
end;
$$;

create or replace function private.round_json(p_challenge_id bigint, p_index smallint)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'index', question_index,
    'roundId', round_id,
    'assetKey', round_id::text,
    'assetPath', asset_path,
    'options', options
  )
  from private.daily_challenge_rounds
  where challenge_id = p_challenge_id and question_index = p_index
$$;

create or replace function private.practice_round_json(p_challenge_id bigint, p_index smallint)
returns jsonb language sql stable security definer set search_path = '' as $$
  select private.round_json(p_challenge_id, p_index) || jsonb_build_object(
    'correctChoiceId', correct_choice_id,
    'revealAssetPath', reveal_asset_path
  )
  from private.daily_challenge_rounds
  where challenge_id = p_challenge_id and question_index = p_index
$$;

create or replace function public.get_casual_quiz_pack(p_category_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_content_version text; v_items jsonb;
begin
  perform private.require_user();
  select current_content_version into v_content_version
  from public.categories where id = p_category_id and is_active;
  if not found then raise exception 'Unsupported quiz.' using errcode = '22023'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', item_id,
    'displayName', display_name,
    'assetPath', asset_path,
    'revealAssetPath', reveal_asset_path,
    'difficulty', difficulty,
    'contentType', metadata->>'scope',
    'distractorIds', metadata->'distractorIds'
  ) order by item_id), '[]'::jsonb)
  into v_items
  from private.quiz_content
  where category_id = p_category_id and content_version = v_content_version;

  if jsonb_array_length(v_items) < 4 then raise exception 'The quiz pack is not currently playable.' using errcode = 'P0001'; end if;
  return jsonb_build_object('categoryId', p_category_id, 'contentVersion', v_content_version, 'items', v_items);
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke all on function public.get_casual_quiz_pack(text) from public, anon;
grant execute on function public.get_casual_quiz_pack(text) to authenticated;

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
  v_correct_label text;
begin
  if p_request_id is null then raise exception 'request id required'; end if;
  select * into strict v_attempt from public.daily_attempts
  where id = p_attempt_id and user_id = v_user for update;

  select * into v_existing from public.daily_answers
  where attempt_id = p_attempt_id and request_id = p_request_id;
  if found then
    select * into strict v_round from private.daily_challenge_rounds
    where challenge_id = v_attempt.challenge_id and question_index = v_existing.question_index;
    select option->>'label' into strict v_correct_label from jsonb_array_elements(v_round.options) option
    where (option->>'id')::uuid = v_round.correct_choice_id;
    return private.attempt_state(p_attempt_id) || jsonb_build_object(
      'lastAnswer', jsonb_build_object(
        'questionIndex', v_existing.question_index,
        'isCorrect', v_existing.is_correct,
        'points', v_existing.points,
        'correctChoiceId', v_round.correct_choice_id,
        'correctLabel', v_correct_label,
        'revealAssetPath', v_round.reveal_asset_path
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

  select option->>'label' into strict v_correct_label
  from jsonb_array_elements(v_round.options) option
  where (option->>'id')::uuid = v_round.correct_choice_id;
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
      'points', case when v_correct then 100 else 0 end,
      'correctChoiceId', v_round.correct_choice_id,
      'correctLabel', v_correct_label,
      'revealAssetPath', v_round.reveal_asset_path
    )
  );
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
      select jsonb_build_object(
        'index', r.question_index,
        'assetKey', v_match.id::text || ':' || r.question_index::text,
        'assetPath', r.asset_path,
        'options', r.options
      ) || case when v_phase->>'phase' = 'reveal' then jsonb_build_object(
        'correctChoiceId', r.correct_choice_id,
        'revealAssetPath', r.reveal_asset_path
      ) else '{}'::jsonb end
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

create or replace function public.start_friend_match(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := private.require_user(); v_room private.friend_rooms%rowtype; v_match uuid;
  v_version text; v_count integer; v_selected record; v_choice_pack jsonb; v_index smallint := 0;
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
    select item_id, asset_path, reveal_asset_path from private.quiz_content
    where category_id = v_room.category_id and content_version = v_version
    order by md5(v_match::text || ':' || item_id) limit 10
  loop
    v_choice_pack := private.quiz_options(v_version, v_selected.item_id, v_match::text || ':' || v_selected.item_id);
    if jsonb_array_length(v_choice_pack->'options') <> 4 then raise exception 'Content pack must provide four options.'; end if;
    insert into private.friend_match_rounds(match_id, question_index, item_id, asset_path, reveal_asset_path, options, correct_choice_id)
    values(
      v_match, v_index, v_selected.item_id, v_selected.asset_path, v_selected.reveal_asset_path,
      v_choice_pack->'options', (v_choice_pack->>'correctChoiceId')::uuid
    );
    v_index := v_index + 1;
  end loop;
  if v_index <> 10 then raise exception 'Content pack must provide at least ten items.'; end if;
  update private.friend_rooms set status = 'playing', current_match_id = v_match, match_sequence = match_sequence + 1,
    updated_at = clock_timestamp(), expires_at = clock_timestamp() + interval '20 minutes' where id = p_room_id;
  perform private.friend_emit(p_room_id, 'started');
  return private.friend_state(p_room_id);
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke all on function public.submit_daily_answer(uuid, smallint, uuid, uuid) from public, anon;
revoke all on function public.start_friend_match(uuid) from public, anon;
grant execute on function public.submit_daily_answer(uuid, smallint, uuid, uuid) to authenticated;
grant execute on function public.start_friend_match(uuid) to authenticated;
