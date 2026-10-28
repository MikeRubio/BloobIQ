begin;

create extension if not exists pgtap with schema extensions;
select plan(29);

select ok((select relrowsecurity from pg_class where oid = 'public.friend_room_events'::regclass), 'room events use RLS');
select ok((select relrowsecurity from pg_class where oid = 'private.friend_rooms'::regclass), 'private rooms use RLS');
select ok((select relrowsecurity from pg_class where oid = 'private.friend_room_members'::regclass), 'private memberships use RLS');
select ok((select relrowsecurity from pg_class where oid = 'private.friend_match_rounds'::regclass), 'private match rounds use RLS');
select ok((select relrowsecurity from pg_class where oid = 'private.friend_answers'::regclass), 'private answers use RLS');
select ok(not has_table_privilege('authenticated', 'private.friend_answers', 'INSERT'), 'clients cannot insert answers directly');
select ok(not has_table_privilege('authenticated', 'private.friend_match_rounds', 'SELECT'), 'clients cannot read protected rounds directly');
select ok(has_function_privilege('authenticated', 'public.create_friend_room(text)', 'EXECUTE'), 'authenticated players create through RPC');
select ok(not has_function_privilege('anon', 'public.create_friend_room(text)', 'EXECUTE'), 'signed-out role cannot create rooms');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('11000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'friend-one@example.test', '', now(), now(), now()),
  ('11000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'friend-two@example.test', '', now(), now(), now()),
  ('11000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'friend-three@example.test', '', now(), now(), now());
insert into public.guest_profiles (user_id, display_name, avatar, avatar_color) values
  ('11000000-0000-0000-0000-000000000001', 'Friend One', '1', '#2D9CDB'),
  ('11000000-0000-0000-0000-000000000002', 'Friend Two', '2', '#FF8A65'),
  ('11000000-0000-0000-0000-000000000003', 'Friend Three', '3', '#54D6A8');

create temp table friend_snapshots (label text primary key, snapshot jsonb);
set local role authenticated;
set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000001';
insert into friend_snapshots values ('created', public.create_friend_room('football'));
select ok((select snapshot->>'code' ~ '^[A-HJ-KM-NP-Z2-9]{6}$' from friend_snapshots where label = 'created'), 'room code is six nonambiguous characters');

set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000002';
insert into friend_snapshots select 'joined', public.join_friend_room((select snapshot->>'code' from friend_snapshots where label = 'created'));
select is((select jsonb_array_length(snapshot->'members') from friend_snapshots where label = 'joined'), 2, 'two independent identities share the roster');
select public.set_friend_ready((select (snapshot->>'roomId')::uuid from friend_snapshots where label = 'created'), true);

set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000001';
select public.set_friend_ready((select (snapshot->>'roomId')::uuid from friend_snapshots where label = 'created'), true);
insert into friend_snapshots select 'started', public.start_friend_match((select (snapshot->>'roomId')::uuid from friend_snapshots where label = 'created'));
select ok((select bool_and((member->>'isReady')::boolean) from friend_snapshots, jsonb_array_elements(snapshot->'members') member where label = 'started'), 'all roster members were ready');
select is((select snapshot->>'status' from friend_snapshots where label = 'started'), 'playing', 'host starts an authoritative match');

reset role;
update private.friend_matches set starts_at = clock_timestamp() - interval '1 second'
where id = (select (snapshot->>'matchId')::uuid from friend_snapshots where label = 'started');
set local role authenticated;
set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000001';
insert into friend_snapshots select 'question', public.get_friend_room_state((select (snapshot->>'roomId')::uuid from friend_snapshots where label = 'created'));
select is((select jsonb_array_length(snapshot->'round'->'options') from friend_snapshots where label = 'question'), 4, 'question exposes four choices');
select ok((select not ((snapshot->'round') ? 'correctChoiceId') from friend_snapshots where label = 'question'), 'answer key stays hidden during answering');

insert into friend_snapshots select 'answered', public.submit_friend_answer(
  (select (snapshot->>'roomId')::uuid from friend_snapshots where label = 'created'),
  (select (snapshot->>'matchId')::uuid from friend_snapshots where label = 'started'), 0,
  (select (snapshot->'round'->'options'->0->>'id')::uuid from friend_snapshots where label = 'question'),
  '22000000-0000-0000-0000-000000000001'
);
select ok((select (snapshot->'myAnswer') is not null from friend_snapshots where label = 'answered'), 'early answer is returned as locked');
select ok((select not ((snapshot->'round') ? 'correctChoiceId') from friend_snapshots where label = 'answered'), 'early answer does not reveal correctness key');
insert into friend_snapshots select 'retry', public.submit_friend_answer(
  (select (snapshot->>'roomId')::uuid from friend_snapshots where label = 'created'),
  (select (snapshot->>'matchId')::uuid from friend_snapshots where label = 'started'), 0,
  (select (snapshot->'round'->'options'->0->>'id')::uuid from friend_snapshots where label = 'question'),
  '22000000-0000-0000-0000-000000000001'
);
select is((select snapshot->'myAnswer'->>'choiceId' from friend_snapshots where label = 'retry'), (select snapshot->'myAnswer'->>'choiceId' from friend_snapshots where label = 'answered'), 'same request is idempotent');

reset role;
select is((select count(*) from private.friend_answers where match_id = (select (snapshot->>'matchId')::uuid from friend_snapshots where label = 'started')), 1::bigint, 'idempotent retry stores one answer');
set local role authenticated;
set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000001';
select throws_ok(
  $$select public.submit_friend_answer(
    (select (snapshot->>'roomId')::uuid from friend_snapshots where label = 'created'),
    (select (snapshot->>'matchId')::uuid from friend_snapshots where label = 'started'), 0, null,
    '22000000-0000-0000-0000-000000000002')$$,
  'P0001', 'Your answer for this question is already locked.', 'second answer request is rejected'
);

set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000003';
select throws_ok(
  $$select public.join_friend_room((select snapshot->>'code' from friend_snapshots where label = 'created'))$$,
  'P0001', 'This room is no longer accepting players.', 'late join is rejected'
);
select is((select count(*) from public.friend_room_events), 0::bigint, 'nonmember cannot read room events');

set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000002';
insert into friend_snapshots select 'reconnected', public.get_friend_room_state((select (snapshot->>'roomId')::uuid from friend_snapshots where label = 'created'));
select is((select count(*) from jsonb_array_elements((select snapshot->'members' from friend_snapshots where label = 'reconnected')) m where (m->>'isCurrentPlayer')::boolean), 1::bigint, 'same identity reconnects to one membership');

reset role;
update private.friend_matches set starts_at = clock_timestamp() - interval '10.5 seconds'
where id = (select (snapshot->>'matchId')::uuid from friend_snapshots where label = 'started');
set local role authenticated;
set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000001';
insert into friend_snapshots select 'reveal', public.get_friend_room_state((select (snapshot->>'roomId')::uuid from friend_snapshots where label = 'created'));
select ok((select (snapshot->'round') ? 'correctChoiceId' from friend_snapshots where label = 'reveal'), 'answer key appears during reveal');
select ok((select count(*) from public.friend_room_events) > 0, 'member can read room event ticks');

reset role;
update private.friend_matches set starts_at = clock_timestamp() - interval '131 seconds'
where id = (select (snapshot->>'matchId')::uuid from friend_snapshots where label = 'started');
set local role authenticated;
set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000001';
insert into friend_snapshots select 'results', public.get_friend_room_state((select (snapshot->>'roomId')::uuid from friend_snapshots where label = 'created'));
select is((select jsonb_array_length(snapshot->'standings') from friend_snapshots where label = 'results'), 2, 'finalization produces the snapshotted two-player standings');
insert into friend_snapshots select 'rematch', public.rematch_friend_room((select (snapshot->>'roomId')::uuid from friend_snapshots where label = 'created'));
select is((select snapshot->>'status' from friend_snapshots where label = 'rematch'), 'lobby', 'host rematch returns active players to the lobby');

select public.set_friend_ready((select (snapshot->>'roomId')::uuid from friend_snapshots where label = 'created'), true);
set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000002';
select public.set_friend_ready((select (snapshot->>'roomId')::uuid from friend_snapshots where label = 'created'), true);
set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000001';
insert into friend_snapshots select 'second_match', public.start_friend_match((select (snapshot->>'roomId')::uuid from friend_snapshots where label = 'created'));
select isnt((select snapshot->>'matchId' from friend_snapshots where label = 'second_match'), (select snapshot->>'matchId' from friend_snapshots where label = 'started'), 'rematch creates a fresh match identity');

reset role;
select is((select count(*) from private.friend_match_rounds where match_id = (select (snapshot->>'matchId')::uuid from friend_snapshots where label = 'second_match')), 10::bigint, 'rematch snapshots ten fresh rounds');

select * from finish();
rollback;
