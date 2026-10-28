begin;

create extension if not exists pgtap with schema extensions;
select plan(47);

select ok((select relrowsecurity from pg_class where oid = 'public.guest_profiles'::regclass), 'profiles use RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.daily_attempts'::regclass), 'attempts use RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.daily_answers'::regclass), 'answers use RLS');
select ok(not has_table_privilege('authenticated', 'public.daily_attempts', 'INSERT'), 'client cannot insert attempts');
select ok(not has_table_privilege('authenticated', 'public.daily_attempts', 'UPDATE'), 'client cannot update scores');
select ok(not has_table_privilege('authenticated', 'public.daily_answers', 'INSERT'), 'client cannot insert answers');
select ok(not has_function_privilege('anon', 'public.start_daily_attempt(text)', 'EXECUTE'), 'anon role cannot start without a session');
select ok(has_function_privilege('authenticated', 'public.start_daily_attempt(text)', 'EXECUTE'), 'authenticated role can start through RPC');
select ok(not has_function_privilege('authenticated', 'private.ensure_daily_challenge(text,date)', 'EXECUTE'), 'private generator is not callable by clients');
select ok((select relrowsecurity from pg_class where oid = 'private.flag_content'::regclass), 'legacy flag content uses RLS');
select ok((select relrowsecurity from pg_class where oid = 'private.daily_challenge_rounds'::regclass), 'private rounds use RLS');
select ok((select relrowsecurity from pg_class where oid = 'private.quiz_content'::regclass), 'generic quiz content uses RLS');
select is((select count(*) from private.quiz_content where content_version = 'flags-195-v1'), 195::bigint, 'hosted flag pack contains 195 sovereign states');
select is((select count(*) from private.quiz_content where content_version = 'football-v1'), 17::bigint, 'hosted football pack contains all requested identities');
select is((select count(*) from private.quiz_content where content_version = 'football-v1' and rights_status = 'trademark_reviewed_approved'), 17::bigint, 'all football identities record project-owner approval');
select is((select count(*) from private.quiz_content where content_version = 'baseball-mlb-v1'), 30::bigint, 'hosted baseball pack contains all current MLB teams');
select is((select count(*) from private.quiz_content where content_version = 'basketball-nba-v1'), 30::bigint, 'hosted basketball pack contains all current NBA teams');
select is((select count(*) from private.quiz_content where content_version = 'baseball-mlb-v1' and rights_status = 'trademark_review_required'), 30::bigint, 'MLB trademarks remain explicitly pending production review');
select is((select count(*) from private.quiz_content where content_version = 'basketball-nba-v1' and rights_status = 'trademark_review_required'), 30::bigint, 'NBA trademarks remain explicitly pending production review');
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
select is(
  (select count(*) from private.daily_challenge_rounds where asset_path is not null),
  (select count(*) from private.daily_challenge_rounds),
  'every persisted round has a hosted asset path'
);

select is(private.ensure_daily_challenge('flags', date '2099-01-02'), private.ensure_daily_challenge('flags', date '2099-01-02'), 'challenge generation is stable');
select is(
  (select count(*) from private.daily_challenge_rounds r join public.daily_challenges c on c.id = r.challenge_id where c.category_id = 'flags' and c.challenge_date = date '2099-01-02'),
  10::bigint,
  'a challenge has ten rounds'
);
select is(
  (select count(*) from private.daily_challenge_rounds r join public.daily_challenges c on c.id = r.challenge_id where c.challenge_date = date '2099-01-02' and jsonb_array_length(r.options) = 4),
  10::bigint,
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

set local role authenticated;
set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000001';
create temp table runtime_snapshots (label text primary key, snapshot jsonb);
insert into runtime_snapshots values ('start', public.start_daily_attempt('flags'));

select is((select snapshot->>'state' from runtime_snapshots where label = 'start'), 'in_progress', 'authenticated player starts a ranked attempt');
select is((select jsonb_array_length(snapshot->'currentRound'->'options') from runtime_snapshots where label = 'start'), 4, 'RPC exposes four choices');
select ok((select not ((snapshot->'currentRound') ? 'correctChoiceId') from runtime_snapshots where label = 'start'), 'RPC does not expose the correct choice');

insert into runtime_snapshots
select 'answer', public.submit_daily_answer(
  (select (snapshot->>'attemptId')::uuid from runtime_snapshots where label = 'start'),
  0,
  null,
  '20000000-0000-0000-0000-000000000001'
);
insert into runtime_snapshots
select 'retry', public.submit_daily_answer(
  (select (snapshot->>'attemptId')::uuid from runtime_snapshots where label = 'start'),
  0,
  null,
  '20000000-0000-0000-0000-000000000001'
);

select is((select (snapshot->>'questionIndex')::integer from runtime_snapshots where label = 'retry'), 1, 'retrying a request does not advance twice');
select is((select (snapshot->'lastAnswer'->>'questionIndex')::integer from runtime_snapshots where label = 'retry'), 0, 'idempotent retry returns the original feedback');
select ok((select (snapshot->'lastAnswer') ? 'correctChoiceId' from runtime_snapshots where label = 'retry'), 'answer feedback reveals the correct choice only after submission');
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
      v_index,
      null,
      extensions.gen_random_uuid()
    );
  end loop;
end;
$$;
insert into runtime_snapshots
select 'final', public.submit_daily_answer(
  (select (snapshot->>'attemptId')::uuid from runtime_snapshots where label = 'start'),
  9,
  null,
  '20000000-0000-0000-0000-000000000010'
);
create temp table final_completion as
select completed_at from public.daily_attempts
where id = (select (snapshot->>'attemptId')::uuid from runtime_snapshots where label = 'start');
insert into runtime_snapshots
select 'final_retry', public.submit_daily_answer(
  (select (snapshot->>'attemptId')::uuid from runtime_snapshots where label = 'start'),
  9,
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

select * from finish();
rollback;
