begin;

create extension if not exists pgtap with schema extensions;
select plan(102);

select ok((select relrowsecurity from pg_class where oid = 'public.guest_profiles'::regclass), 'profiles use RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.daily_attempts'::regclass), 'attempts use RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.daily_answers'::regclass), 'answers use RLS');
select ok(not has_table_privilege('authenticated', 'public.daily_attempts', 'INSERT'), 'client cannot insert attempts');
select ok(not has_table_privilege('authenticated', 'public.daily_attempts', 'UPDATE'), 'client cannot update scores');
select ok(not has_table_privilege('authenticated', 'public.daily_answers', 'INSERT'), 'client cannot insert answers');
select ok(not has_function_privilege('anon', 'public.start_daily_attempt(text)', 'EXECUTE'), 'anon role cannot start without a session');
select ok(has_function_privilege('authenticated', 'public.start_daily_attempt(text)', 'EXECUTE'), 'authenticated role can start through RPC');
select ok(not has_function_privilege('anon', 'public.prepare_account_deletion()', 'EXECUTE'), 'anonymous API role cannot request account deletion');
select ok(has_function_privilege('authenticated', 'public.prepare_account_deletion()', 'EXECUTE'), 'signed-in guest can prepare their own account deletion');
select ok(not has_function_privilege('anon', 'public.report_and_block_player(uuid,text,uuid)', 'EXECUTE'), 'anonymous API role cannot submit player reports');
select ok(has_function_privilege('authenticated', 'public.report_and_block_player(uuid,text,uuid)', 'EXECUTE'), 'signed-in guest can use the scoped report and block RPC');
select ok(not has_function_privilege('authenticated', 'private.ensure_daily_challenge(text,date)', 'EXECUTE'), 'private generator is not callable by clients');
select ok((select relrowsecurity from pg_class where oid = 'private.flag_content'::regclass), 'legacy flag content uses RLS');
select ok((select relrowsecurity from pg_class where oid = 'private.daily_challenge_rounds'::regclass), 'private rounds use RLS');
select ok((select relrowsecurity from pg_class where oid = 'private.quiz_content'::regclass), 'generic quiz content uses RLS');
select is((select count(*) from private.quiz_content where content_version = 'flags-195-v1'), 195::bigint, 'hosted flag pack contains 195 sovereign states');
select is((select count(*) from private.quiz_content where content_version = 'football-v1'), 17::bigint, 'hosted football pack contains all requested identities');
select is((select count(*) from private.quiz_content where content_version = 'football-v1' and rights_status = 'trademark_reviewed_approved'), 17::bigint, 'all football identities record project-owner approval');
select is((select count(*) from private.quiz_content where content_version = 'football-symbols-v2'), 10::bigint, 'archived football symbol pack remains immutable');
select is((select count(*) from private.quiz_content where content_version = 'football-clubs-v3'), 88::bigint, 'football source catalogue records every current club and original crest');
select is((select count(*) from private.quiz_content where content_version = 'football-mixed-v3'), 30::bigint, 'active football pack has ten organisations plus twenty club symbols');
select is((select current_content_version from public.categories where id = 'football'), 'football-mixed-v3', 'football category selects the mixed pack');
select is((select count(*) from private.quiz_content where content_version = 'football-mixed-v3' and metadata->>'scope' = 'club'), 20::bigint, 'mixed football pack contains five eligible clubs per requested competition');
select ok((select bool_and(asset_path <> reveal_asset_path and metadata->>'questionAssetRole' = 'symbol_only_quiz_variant' and metadata->>'revealAssetRole' = 'complete_original_identity') from private.quiz_content where content_version = 'football-mixed-v3' and metadata->>'scope' <> 'club'), 'football organisation questions keep separate symbol and reveal roles');
select ok((select bool_and(asset_path <> reveal_asset_path and metadata->>'questionAssetRole' = 'symbol_only_quiz_variant' and metadata->>'revealAssetRole' = 'complete_official_club_crest') from private.quiz_content where content_version = 'football-mixed-v3' and metadata->>'scope' = 'club'), 'football club questions hide answer text until the complete crest reveal');
select is((select count(*) from private.quiz_content where content_version = 'baseball-mlb-v1'), 30::bigint, 'hosted baseball pack contains all current MLB teams');
select is((select count(*) from private.quiz_content where content_version = 'basketball-nba-v1'), 30::bigint, 'hosted basketball pack contains all current NBA teams');
select is((select count(*) from private.quiz_content where content_version = 'baseball-mlb-v1' and rights_status = 'trademark_review_required'), 30::bigint, 'MLB trademarks remain explicitly pending production review');
select is((select count(*) from private.quiz_content where content_version = 'basketball-nba-v1' and rights_status = 'trademark_review_required'), 30::bigint, 'NBA trademarks remain explicitly pending production review');
select is((select count(*) from private.quiz_content where content_version = 'baseball-global-v2'), 54::bigint, 'immutable baseball source pack retains all MLB and winter identities');
select is((select count(*) from private.quiz_content where content_version = 'baseball-symbols-v3'), 47::bigint, 'active baseball pack has enough curated symbols for daily and friends matches');
select is((select count(*) from private.quiz_content where content_version = 'baseball-symbols-v3' and metadata->>'leagueKey' = 'lidom'), 6::bigint, 'symbol pack retains six LIDOM clubs');
select is((select count(*) from private.quiz_content where content_version = 'baseball-symbols-v3' and metadata->>'leagueKey' = 'lvbp'), 6::bigint, 'symbol pack retains six eligible LVBP clubs');
select is((select count(*) from private.quiz_content where content_version = 'baseball-symbols-v3' and metadata->>'leagueKey' = 'lmp'), 8::bigint, 'symbol pack retains eight eligible Mexican Pacific clubs');
select is((select count(*) from private.quiz_content where content_version = 'baseball-symbols-v3' and metadata->>'competitionKey' = 'mlb'), 27::bigint, 'symbol pack retains twenty-seven eligible MLB clubs');
select is((select current_content_version from public.categories where id = 'baseball'), 'baseball-symbols-v3', 'baseball category selects the symbol-only pack');
select ok((select bool_and(asset_path <> reveal_asset_path and metadata->>'revealAssetRole' = 'complete_official_team_identity') from private.quiz_content where content_version = 'baseball-symbols-v3'), 'baseball questions keep separate question and reveal artwork');
select ok(not exists(
  select 1 from private.quiz_content
  where content_version = 'baseball-symbols-v3'
    and item_id = any(array[
      'baseball-athletics', 'baseball-chicago-cubs', 'baseball-chicago-white-sox',
      'baseball-lvbp-bravos-de-margarita',
      'baseball-lvbp-caribes-de-anzoategui', 'baseball-lmp-tomateros-de-culiacan',
      'baseball-lmp-yaquis-de-obregon'
    ])
), 'wordmark-only baseball identities are reveal-only and excluded from question selection');
select is((select count(*) from private.quiz_content where content_version = 'basketball-expanded-v2'), 78::bigint, 'active basketball pack combines logos and four trivia topics');
select is((select count(*) from private.quiz_content where content_version = 'basketball-expanded-v2' and metadata->>'scope' = 'mascot'), 12::bigint, 'basketball pack contains twelve mascot questions');
select is((select count(*) from private.quiz_content where content_version = 'basketball-expanded-v2' and metadata->>'scope' = 'arena'), 12::bigint, 'basketball pack contains twelve arena questions');
select is((select count(*) from private.quiz_content where content_version = 'basketball-expanded-v2' and metadata->>'scope' = 'retired-number'), 12::bigint, 'basketball pack contains twelve retired-number questions');
select is((select count(*) from private.quiz_content where content_version = 'basketball-expanded-v2' and metadata->>'scope' = 'franchise-legend'), 12::bigint, 'basketball pack contains twelve franchise-legend questions');
select is((select current_content_version from public.categories where id = 'basketball'), 'basketball-expanded-v2', 'basketball category selects the expanded pack');
select ok(not exists(
  select 1
  from private.quiz_content correct_item
  cross join lateral jsonb_array_elements(
    private.quiz_options(correct_item.content_version, correct_item.item_id, 'answer-type-regression')->'options'
  ) option
  where correct_item.content_version = 'basketball-expanded-v2'
    and not exists (
      select 1
      from private.quiz_content candidate
      where candidate.content_version = correct_item.content_version
        and candidate.display_name = option->>'label'
        and candidate.metadata->>'scope' is not distinct from correct_item.metadata->>'scope'
    )
), 'basketball options always match the question answer type');
select ok(not exists(
  select 1
  from private.quiz_content correct_item
  cross join lateral jsonb_array_elements(
    private.quiz_options(correct_item.content_version, correct_item.item_id, 'retired-number-regression')->'options'
  ) option
  where correct_item.content_version = 'basketball-expanded-v2'
    and correct_item.metadata->>'scope' = 'retired-number'
    and option->>'label' !~ '^No[.] [0-9]+$'
), 'retired-number questions present four numeric answers');
select ok(not exists(
  select 1
  from private.quiz_content correct_item
  cross join lateral jsonb_array_elements(
    private.quiz_options(correct_item.content_version, correct_item.item_id, 'legend-name-regression')->'options'
  ) option
  where correct_item.content_version = 'basketball-expanded-v2'
    and correct_item.metadata->>'scope' = 'franchise-legend'
    and not exists (
      select 1
      from private.quiz_content candidate
      where candidate.content_version = correct_item.content_version
        and candidate.display_name = option->>'label'
        and candidate.metadata->>'scope' = 'franchise-legend'
    )
), 'franchise-legend questions present four player names');
select ok(not exists(
  select 1 from private.quiz_content
  where content_version in ('baseball-symbols-v3', 'basketball-expanded-v2')
    and (coalesce(metadata->>'questionPrompt', '') = '' or coalesce(metadata->>'questionDescription', '') = '')
), 'expanded sports questions include prompt and accessibility copy');
select is((select current_content_version from public.categories where id = 'brands'), 'brands-symbols-v1', 'brands category selects the symbol pack');
select is((select current_content_version from public.categories where id = 'history'), 'people-history-v1', 'history category selects the portrait pack');
select is((select current_content_version from public.categories where id = 'celebrities'), 'people-celebrities-v1', 'celebrities category selects the portrait pack');
select is((select count(*) from private.quiz_content where content_version = 'brands-symbols-v1'), 22::bigint, 'brand pack contains twenty-two eligible symbols');
select is((select count(*) from private.quiz_content where content_version = 'people-history-v1'), 100::bigint, 'history pack contains one hundred unique figures');
select is((select count(*) from private.quiz_content where content_version = 'people-celebrities-v1'), 95::bigint, 'celebrity duplicates are removed from the ninety-five-person pack');
select ok(not exists(
  select 1 from (
    select metadata->>'scope' scope, count(*) count
    from private.quiz_content where content_version = 'brands-symbols-v1' group by 1
  ) groups where count < 4
), 'every brand scope has at least four same-type answers');
select ok(not exists(
  select 1 from private.quiz_content
  where content_version in ('brands-symbols-v1', 'people-history-v1', 'people-celebrities-v1')
    and (coalesce(metadata->>'questionPrompt', '') = '' or coalesce(metadata->>'questionDescription', '') = ''
      or position(lower(display_name) in lower(metadata->>'questionDescription')) > 0)
), 'new packs include non-answer-revealing prompts and accessibility descriptions');
select ok(not exists(
  select 1 from private.quiz_content item
  cross join lateral jsonb_array_elements(private.quiz_options(item.content_version, item.item_id, 'new-pack-options')->'options') option
  where item.content_version in ('brands-symbols-v1', 'people-history-v1', 'people-celebrities-v1')
  group by item.item_id
  having count(*) <> 4 or count(distinct option->>'label') <> 4
), 'new packs always produce four distinct options');
select is(private.ensure_daily_challenge('brands', date '2099-01-03'), private.ensure_daily_challenge('brands', date '2099-01-03'), 'brand challenge generation is stable');
select is((select count(*) from private.daily_challenge_rounds r join public.daily_challenges c on c.id = r.challenge_id where c.category_id = 'brands' and c.challenge_date = date '2099-01-03'), 10::bigint, 'a brand challenge has ten rounds');
select is(private.ensure_daily_challenge('history', date '2099-01-03'), private.ensure_daily_challenge('history', date '2099-01-03'), 'history challenge generation is stable');
select is((select count(*) from private.daily_challenge_rounds r join public.daily_challenges c on c.id = r.challenge_id where c.category_id = 'history' and c.challenge_date = date '2099-01-03'), 10::bigint, 'a history challenge has ten rounds');
select is(private.ensure_daily_challenge('celebrities', date '2099-01-03'), private.ensure_daily_challenge('celebrities', date '2099-01-03'), 'celebrity challenge generation is stable');
select is((select count(*) from private.daily_challenge_rounds r join public.daily_challenges c on c.id = r.challenge_id where c.category_id = 'celebrities' and c.challenge_date = date '2099-01-03'), 10::bigint, 'a celebrity challenge has ten rounds');
select is((select count(*) from private.flag_content where content_version = 'flags-v1'), 0::bigint, 'legacy Flags v1 content is retired');
select ok((select public from storage.buckets where id = 'quiz-assets'), 'quiz asset bucket is public for reads');
select is(private.ensure_daily_challenge('football', date '2099-01-02'), private.ensure_daily_challenge('football', date '2099-01-02'), 'football challenge generation is stable');
select is(
  (select count(*) from private.daily_challenge_rounds r join public.daily_challenges c on c.id = r.challenge_id where c.category_id = 'football' and c.challenge_date = date '2099-01-02'),
  10::bigint,
  'a football challenge has ten rounds'
);
select is(private.ensure_daily_challenge('baseball', date '2099-01-02'), private.ensure_daily_challenge('baseball', date '2099-01-02'), 'baseball challenge generation is stable');
select is(
  (select count(*) from private.daily_challenge_rounds r join public.daily_challenges c on c.id = r.challenge_id where c.category_id = 'baseball' and c.challenge_date = date '2099-01-02'),
  10::bigint,
  'a baseball challenge has ten rounds'
);
select is(private.ensure_daily_challenge('basketball', date '2099-01-02'), private.ensure_daily_challenge('basketball', date '2099-01-02'), 'basketball challenge generation is stable');
select is(
  (select count(*) from private.daily_challenge_rounds r join public.daily_challenges c on c.id = r.challenge_id where c.category_id = 'basketball' and c.challenge_date = date '2099-01-02'),
  10::bigint,
  'a basketball challenge has ten rounds'
);
select ok(not exists(
  select 1
  from private.daily_challenge_rounds r
  join public.daily_challenges c on c.id = r.challenge_id
  join private.quiz_content correct_item on correct_item.content_version = c.content_version and correct_item.item_id = r.asset_key
  cross join lateral jsonb_array_elements(r.options) option
  where c.category_id = 'baseball' and c.challenge_date = date '2099-01-02'
    and not exists (
      select 1 from private.quiz_content candidate
      where candidate.content_version = c.content_version
        and candidate.display_name = option->>'label'
        and candidate.metadata->>'scope' = correct_item.metadata->>'scope'
        and coalesce(candidate.metadata->>'competitionKey', '') = coalesce(correct_item.metadata->>'competitionKey', '')
    )
), 'baseball distractors remain within the same division or winter league');
select is(
  (select jsonb_object_agg(scope, questions) from (
    select q.metadata->>'scope' scope, count(*) questions
    from private.daily_challenge_rounds r
    join public.daily_challenges c on c.id = r.challenge_id
    join private.quiz_content q on q.content_version = c.content_version and q.item_id = r.asset_key
    where c.category_id = 'basketball' and c.challenge_date = date '2099-01-02'
    group by q.metadata->>'scope'
  ) topic_counts),
  '{"arena":2,"franchise-legend":2,"mascot":2,"retired-number":2,"team-logo":2}'::jsonb,
  'basketball daily selection balances all five question topics'
);
select ok(not exists(
  select 1 from private.daily_challenge_rounds
  where coalesce(question_prompt, '') = '' or coalesce(question_description, '') = ''
), 'every persisted round carries prompt and accessibility copy');
select is(
  (select count(*) from private.daily_challenge_rounds where asset_path is not null),
  (select count(*) from private.daily_challenge_rounds),
  'every persisted round has a hosted asset path'
);
select is(
  (select count(*) from private.daily_challenge_rounds where reveal_asset_path is not null),
  (select count(*) from private.daily_challenge_rounds),
  'every persisted round has reveal artwork'
);
select ok(not exists(
  select 1
  from private.quiz_content
  where content_version = 'football-mixed-v3'
    and asset_path = reveal_asset_path
), 'every active football identity persists separate question and reveal artwork');
select ok(not exists(
  select 1
  from private.daily_challenge_rounds r
  join public.daily_challenges c on c.id = r.challenge_id
  join private.quiz_content correct_item on correct_item.content_version = c.content_version and correct_item.item_id = r.asset_key
  cross join lateral jsonb_array_elements(r.options) option
  where c.category_id = 'football' and c.challenge_date = date '2099-01-02'
    and not exists (
      select 1 from private.quiz_content candidate
      where candidate.content_version = c.content_version
        and candidate.display_name = option->>'label'
        and candidate.metadata->>'scope' = correct_item.metadata->>'scope'
        and (correct_item.metadata->>'scope' <> 'club'
          or candidate.metadata->>'competitionKey' = correct_item.metadata->>'competitionKey')
    )
), 'football distractors compare organisations by type and clubs within their competition');
select ok(not exists(
  select 1 from private.daily_challenge_rounds r join public.daily_challenges c on c.id = r.challenge_id
  where c.category_id = 'football' and c.challenge_date = date '2099-01-02'
    and (jsonb_array_length(r.options) <> 4
      or (select count(distinct option->>'id') from jsonb_array_elements(r.options) option) <> 4
      or (select count(distinct option->>'label') from jsonb_array_elements(r.options) option) <> 4
      or (select count(*) from jsonb_array_elements(r.options) option where (option->>'id')::uuid = r.correct_choice_id) <> 1)
), 'football rounds have four distinct options and exactly one correct choice');

select is(private.ensure_daily_challenge('flags', date '2099-01-02'), private.ensure_daily_challenge('flags', date '2099-01-02'), 'challenge generation is stable');
select is(
  (select count(*) from private.daily_challenge_rounds r join public.daily_challenges c on c.id = r.challenge_id where c.category_id = 'flags' and c.challenge_date = date '2099-01-02'),
  10::bigint,
  'a challenge has ten rounds'
);
select is(
  (select count(*) from private.daily_challenge_rounds r join public.daily_challenges c on c.id = r.challenge_id where c.challenge_date = date '2099-01-02' and jsonb_array_length(r.options) = 4),
  40::bigint,
  'every round has four opaque choices'
);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'one@example.test', '', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'two@example.test', '', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'three@example.test', '', now(), now(), now());

insert into public.guest_profiles (user_id, display_name, avatar, avatar_color) values
  ('10000000-0000-0000-0000-000000000001', 'Player One', '1', '#2D9CDB'),
  ('10000000-0000-0000-0000-000000000002', 'Player Two', '2', '#FF8A65'),
  ('10000000-0000-0000-0000-000000000003', 'Player Three', '3', '#9B7EDE');

insert into private.online_access(user_id,kind,notice_version) select id,'adult',private.parent_notice_version() from auth.users where id::text like '10000000-%' on conflict do nothing;

set local role authenticated;
set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000001';
create temp table runtime_snapshots (label text primary key, snapshot jsonb);
insert into runtime_snapshots values ('start', public.start_daily_attempt('flags'));

select is((select snapshot->>'state' from runtime_snapshots where label = 'start'), 'in_progress', 'authenticated player starts a ranked attempt');
select is((select jsonb_array_length(snapshot->'currentRound'->'options') from runtime_snapshots where label = 'start'), 4, 'RPC exposes four choices');
select ok((select not ((snapshot->'currentRound') ? 'correctChoiceId') from runtime_snapshots where label = 'start'), 'RPC does not expose the correct choice');
select ok((select not ((snapshot->'currentRound') ? 'revealAssetPath') from runtime_snapshots where label = 'start'), 'RPC hides complete reveal artwork while answering');
reset role;
select ok((select not exists(
  select 1 from private.quiz_content q where q.item_id = snapshot->'currentRound'->>'assetKey'
) from runtime_snapshots where label = 'start'), 'RPC uses an opaque question asset key');
set local role authenticated;

insert into runtime_snapshots
select 'answer', public.submit_daily_answer(
  (select (snapshot->>'attemptId')::uuid from runtime_snapshots where label = 'start'),
  0::smallint,
  null,
  '20000000-0000-0000-0000-000000000001'
);
insert into runtime_snapshots
select 'retry', public.submit_daily_answer(
  (select (snapshot->>'attemptId')::uuid from runtime_snapshots where label = 'start'),
  0::smallint,
  null,
  '20000000-0000-0000-0000-000000000001'
);

select is((select (snapshot->>'questionIndex')::integer from runtime_snapshots where label = 'retry'), 1, 'retrying a request does not advance twice');
select is((select (snapshot->'lastAnswer'->>'questionIndex')::integer from runtime_snapshots where label = 'retry'), 0, 'idempotent retry returns the original feedback');
select ok((select (snapshot->'lastAnswer') ? 'correctChoiceId' from runtime_snapshots where label = 'retry'), 'answer feedback reveals the correct choice only after submission');
select ok((select (snapshot->'lastAnswer') ? 'revealAssetPath' from runtime_snapshots where label = 'retry'), 'answer feedback reveals the complete identity artwork');
select throws_ok(
  $$update public.daily_attempts set score = 1000$$,
  '42501',
  'permission denied for table daily_attempts',
  'client cannot tamper with score directly'
);

reset role;
select is(
  (select count(*) from public.daily_answers where attempt_id = (select (snapshot->>'attemptId')::uuid from runtime_snapshots where label = 'start')),
  1::bigint,
  'idempotent retry stores one answer'
);

set local role authenticated;
set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000001';
do $$
declare v_index smallint;
begin
  for v_index in 1..8 loop
    perform public.submit_daily_answer(
      (select (snapshot->>'attemptId')::uuid from runtime_snapshots where label = 'start'),
      v_index::smallint,
      null,
      extensions.gen_random_uuid()
    );
  end loop;
end;
$$;
insert into runtime_snapshots
select 'final', public.submit_daily_answer(
  (select (snapshot->>'attemptId')::uuid from runtime_snapshots where label = 'start'),
  9::smallint,
  null,
  '20000000-0000-0000-0000-000000000010'
);
create temp table final_completion as
select completed_at from public.daily_attempts
where id = (select (snapshot->>'attemptId')::uuid from runtime_snapshots where label = 'start');
insert into runtime_snapshots
select 'final_retry', public.submit_daily_answer(
  (select (snapshot->>'attemptId')::uuid from runtime_snapshots where label = 'start'),
  9::smallint,
  null,
  '20000000-0000-0000-0000-000000000010'
);
select is((select snapshot->>'state' from runtime_snapshots where label = 'final_retry'), 'completed', 'duplicate final answer returns the completed attempt');
select is(
  (select completed_at from public.daily_attempts where id = (select (snapshot->>'attemptId')::uuid from runtime_snapshots where label = 'start')),
  (select completed_at from final_completion),
  'duplicate final answer does not finalise twice'
);

reset role;
select is(
  (select count(*) from public.daily_answers where attempt_id = (select (snapshot->>'attemptId')::uuid from runtime_snapshots where label = 'start')),
  10::bigint,
  'completed ranked attempt stores exactly ten answers'
);

update public.daily_attempts
set status = 'completed', current_index = 10, score = 900, correct_count = 9, active_duration_ms = 30000, completed_at = clock_timestamp()
where id = (select (snapshot->>'attemptId')::uuid from runtime_snapshots where label = 'start');

insert into public.daily_attempts (challenge_id, category_id, user_id, status, current_index, score, correct_count, active_duration_ms, completed_at)
select challenge_id, category_id, '10000000-0000-0000-0000-000000000002', 'completed', 10, 900, 9, 30000, clock_timestamp()
from public.daily_attempts where user_id = '10000000-0000-0000-0000-000000000001';
insert into public.daily_attempts (challenge_id, category_id, user_id, status, current_index, score, correct_count, active_duration_ms, completed_at)
select challenge_id, category_id, '10000000-0000-0000-0000-000000000003', 'completed', 10, 900, 9, 40000, clock_timestamp()
from public.daily_attempts where user_id = '10000000-0000-0000-0000-000000000001';

set local role authenticated;
set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000001';
select is((select count(*) from public.daily_attempts), 1::bigint, 'RLS exposes only the current player attempt');
select is(
  (select array_agg((entry->>'position')::integer order by ordinal)
   from jsonb_array_elements(public.get_leaderboard('flags', 'today', 20)->'entries') with ordinality as ranked(entry, ordinal)),
  array[1, 1, 3],
  'daily ranking shares exact ties and then skips rank'
);
select is(
  (select array_agg((entry->>'position')::integer order by ordinal)
   from jsonb_array_elements(public.get_leaderboard('flags', 'week', 20)->'entries') with ordinality as ranked(entry, ordinal)),
  array[1, 1, 3],
  'weekly ranking uses the same score and duration ordering'
);
select is(public.get_leaderboard('flags', 'week', 20)->>'boundaryStart', to_char(date_trunc('week', now() at time zone 'utc'), 'YYYY-MM-DD'), 'week starts on Monday UTC');

reset role;
select throws_ok(
  $$insert into public.daily_attempts (challenge_id, category_id, user_id)
    select challenge_id, category_id, user_id from public.daily_attempts where user_id = '10000000-0000-0000-0000-000000000001' limit 1$$,
  '23505',
  null,
  'database rejects a second attempt for the same daily challenge'
);

select * from finish(true);
rollback;
