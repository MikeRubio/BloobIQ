create function private.clear_guest_data(p_user uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('online-access:'||p_user::text,0));
  delete from private.online_access where user_id=p_user;
  perform private.clear_friend_data(p_user);
  delete from private.player_reports where reporter_user_id=p_user or reported_user_id=p_user;
  delete from private.player_blocks where blocker_user_id=p_user or blocked_user_id=p_user;
  delete from private.admob_ssv_events e using private.ad_reward_references r where r.user_id=p_user and e.reward_reference=r.reference;
  delete from private.ad_reward_references where user_id=p_user;
  delete from public.daily_attempts where user_id=p_user;
  delete from public.guest_profiles where user_id=p_user;
  update private.parental_consents set status='deleted',deleted_at=coalesce(deleted_at,clock_timestamp()),
    proof_cleanup_due_at=coalesce(proof_cleanup_due_at,clock_timestamp()+interval '30 days') where user_id=p_user;
end; $$;
create or replace function public.prepare_account_deletion() returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := private.require_auth_session();
begin
  perform private.clear_guest_data(v_user);
  return jsonb_build_object('ready',true);
end; $$;


revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.friend_is_member(uuid) to authenticated;

