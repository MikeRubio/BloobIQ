create table private.ad_reward_references (
  reference uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  casual_run_id uuid not null,
  category_id text not null references public.categories(id) on delete restrict,
  client_earned_at timestamptz,
  ssv_verified_at timestamptz,
  ssv_transaction_id text,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp() + interval '48 hours'),
  unique (user_id, casual_run_id),
  unique (ssv_transaction_id),
  check (expires_at > created_at)
);

create index ad_reward_references_user_created_idx
  on private.ad_reward_references (user_id, created_at desc);

create table private.admob_ssv_events (
  transaction_id text primary key,
  reward_reference uuid,
  ad_unit_id text not null,
  reward_type text not null,
  reward_amount numeric not null,
  callback_timestamp bigint not null,
  signed_query text not null,
  status text not null check (status in ('verified', 'rejected', 'duplicate_reference')),
  rejection_reason text,
  received_at timestamptz not null default clock_timestamp(),
  check (reward_amount > 0)
);

create index admob_ssv_events_reference_idx on private.admob_ssv_events (reward_reference, received_at desc);

alter table private.ad_reward_references enable row level security;
alter table private.admob_ssv_events enable row level security;
revoke all on private.ad_reward_references, private.admob_ssv_events from anon, authenticated, public;

create or replace function public.issue_ad_reward_reference(p_run_id uuid, p_category_id text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := private.require_user();
  v_reference uuid;
begin
  if not exists (select 1 from public.categories where id = p_category_id and is_active) then
    raise exception 'Category is not available';
  end if;
  if (select count(*) from private.ad_reward_references where user_id = v_user and created_at > clock_timestamp() - interval '1 hour') >= 30 then
    raise exception 'Reward reference rate limit exceeded';
  end if;

  insert into private.ad_reward_references (user_id, casual_run_id, category_id)
  values (v_user, p_run_id, p_category_id)
  on conflict (user_id, casual_run_id) do update set category_id = excluded.category_id
  returning reference into v_reference;
  return v_reference;
end;
$$;

create or replace function public.mark_ad_reward_client_earned(p_reference uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_user uuid := private.require_user();
begin
  update private.ad_reward_references
  set client_earned_at = coalesce(client_earned_at, clock_timestamp())
  where reference = p_reference and user_id = v_user and expires_at > clock_timestamp();
  if not found then raise exception 'Reward reference not found'; end if;
end;
$$;

create or replace function public.process_admob_ssv(
  p_transaction_id text,
  p_reference uuid,
  p_ad_unit_id text,
  p_reward_type text,
  p_reward_amount numeric,
  p_callback_timestamp bigint,
  p_signed_query text,
  p_verified boolean,
  p_rejection_reason text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare v_reward private.ad_reward_references%rowtype;
begin
  insert into private.admob_ssv_events (
    transaction_id, reward_reference, ad_unit_id, reward_type, reward_amount,
    callback_timestamp, signed_query, status, rejection_reason
  ) values (
    p_transaction_id, p_reference, p_ad_unit_id, p_reward_type, p_reward_amount,
    p_callback_timestamp, p_signed_query, case when p_verified then 'verified' else 'rejected' end, p_rejection_reason
  ) on conflict (transaction_id) do nothing;
  if not found then return 'duplicate_transaction'; end if;

  select * into v_reward from private.ad_reward_references where reference = p_reference for update;
  if not found then
    update private.admob_ssv_events set status = 'rejected', rejection_reason = 'unknown_reference' where transaction_id = p_transaction_id;
    return 'unknown_reference';
  end if;
  if not p_verified then return 'rejected'; end if;
  if v_reward.expires_at <= clock_timestamp() then
    update private.admob_ssv_events set status = 'rejected', rejection_reason = 'expired_reference' where transaction_id = p_transaction_id;
    return 'expired_reference';
  end if;
  if v_reward.ssv_verified_at is not null then
    update private.admob_ssv_events set status = 'duplicate_reference', rejection_reason = 'reward_already_verified' where transaction_id = p_transaction_id;
    return 'duplicate_reference';
  end if;

  update private.ad_reward_references
  set ssv_verified_at = clock_timestamp(), ssv_transaction_id = p_transaction_id
  where reference = p_reference;
  return 'verified';
end;
$$;

revoke all on function public.issue_ad_reward_reference(uuid, text) from public, anon;
grant execute on function public.issue_ad_reward_reference(uuid, text) to authenticated;
revoke all on function public.mark_ad_reward_client_earned(uuid) from public, anon;
grant execute on function public.mark_ad_reward_client_earned(uuid) to authenticated;
revoke all on function public.process_admob_ssv(text, uuid, text, text, numeric, bigint, text, boolean, text) from public, anon, authenticated;
grant execute on function public.process_admob_ssv(text, uuid, text, text, numeric, bigint, text, boolean, text) to service_role;
