begin;

create extension if not exists pgtap with schema extensions;
select plan(19);

select ok((select relrowsecurity from pg_class where oid = 'private.ad_reward_references'::regclass), 'reward references use RLS');
select ok((select relrowsecurity from pg_class where oid = 'private.admob_ssv_events'::regclass), 'SSV events use RLS');
select ok(not has_table_privilege('authenticated', 'private.ad_reward_references', 'SELECT'), 'clients cannot read reward references directly');
select ok(not has_function_privilege('anon', 'public.issue_ad_reward_reference(uuid,text)', 'EXECUTE'), 'signed-out clients cannot issue references');
select ok(has_function_privilege('authenticated', 'public.issue_ad_reward_reference(uuid,text)', 'EXECUTE'), 'authenticated clients issue opaque references through RPC');
select ok(has_function_privilege('authenticated', 'public.mark_ad_reward_client_earned(uuid)', 'EXECUTE'), 'authenticated clients can acknowledge the client reward event');
select ok(not has_function_privilege('authenticated', 'public.process_admob_ssv(text,uuid,text,text,numeric,bigint,text,boolean,text)', 'EXECUTE'), 'clients cannot process SSV callbacks');
select ok(has_function_privilege('service_role', 'public.process_admob_ssv(text,uuid,text,text,numeric,bigint,text,boolean,text)', 'EXECUTE'), 'only the Edge Function service role processes SSV');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('12000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'ads-one@example.test', '', now(), now(), now()),
  ('12000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'ads-two@example.test', '', now(), now(), now());

set local role authenticated;
set local "request.jwt.claim.sub" = '12000000-0000-0000-0000-000000000001';
create temp table reward_snapshots (label text primary key, reference uuid);
insert into reward_snapshots values ('first', public.issue_ad_reward_reference('32000000-0000-0000-0000-000000000001', 'flags'));
insert into reward_snapshots values ('retry', public.issue_ad_reward_reference('32000000-0000-0000-0000-000000000001', 'flags'));
reset role;
select ok((select reference is not null from reward_snapshots where label = 'first'), 'a run receives an opaque reward reference');
select is((select reference from reward_snapshots where label = 'retry'), (select reference from reward_snapshots where label = 'first'), 'issuing twice for one run is idempotent');
select is((select count(*) from private.ad_reward_references where casual_run_id = '32000000-0000-0000-0000-000000000001'), 1::bigint, 'one run stores one reference');
set local role authenticated;
set local "request.jwt.claim.sub" = '12000000-0000-0000-0000-000000000001';
select public.mark_ad_reward_client_earned((select reference from reward_snapshots where label = 'first'));
reset role;
select ok((select client_earned_at is not null from private.ad_reward_references where reference = (select reference from reward_snapshots where label = 'first')), 'client reward acknowledgement is stored');

set local role authenticated;
set local "request.jwt.claim.sub" = '12000000-0000-0000-0000-000000000002';
select throws_ok(
  $$select public.mark_ad_reward_client_earned((select reference from reward_snapshots where label = 'first'))$$,
  'P0001', 'Reward reference not found', 'another player cannot acknowledge the reward'
);

reset role;
set local role service_role;
select is(
  public.process_admob_ssv('txn-one', (select reference from reward_snapshots where label = 'first'), 'test-unit', 'revive', 1, 1700000000000, 'signed-query', true, null),
  'verified', 'a valid callback verifies the reference'
);
reset role;
select ok((select ssv_verified_at is not null from private.ad_reward_references where reference = (select reference from reward_snapshots where label = 'first')), 'verification timestamp is stored');
set local role service_role;
select is(
  public.process_admob_ssv('txn-one', (select reference from reward_snapshots where label = 'first'), 'test-unit', 'revive', 1, 1700000000000, 'signed-query', true, null),
  'duplicate_transaction', 'a repeated Google transaction is idempotent'
);
reset role;
select is((select count(*) from private.admob_ssv_events where transaction_id = 'txn-one'), 1::bigint, 'a repeated transaction stores one event');
set local role service_role;
select is(
  public.process_admob_ssv('txn-two', (select reference from reward_snapshots where label = 'first'), 'test-unit', 'revive', 1, 1700000000001, 'signed-query-2', true, null),
  'duplicate_reference', 'a second transaction cannot verify the same revive'
);
reset role;
select is((select count(*) from private.admob_ssv_events where reward_reference = (select reference from reward_snapshots where label = 'first')), 2::bigint, 'duplicate-reference evidence remains auditable');

select * from finish();
rollback;
