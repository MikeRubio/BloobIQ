-- Hourly automatic retention, plus immediate permission checks on every request.
create function private.expire_parental_consents() returns void language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in select id,user_id from private.parental_consents where status='approved' and expires_at<=clock_timestamp() loop
    if r.user_id is not null then perform pg_advisory_xact_lock(hashtextextended('online-access:'||r.user_id::text,0)); end if;
    update private.parental_consents set status='revoked',withdrawn_at=expires_at,sharing_allowed=false where id=r.id;
    if r.user_id is not null then perform private.clear_friend_data(r.user_id); end if;
  end loop;
  for r in select user_id from private.parental_consents where status='revoked' and withdrawn_at<clock_timestamp()-interval '30 days' and user_id is not null loop
    perform private.clear_guest_data(r.user_id);
    delete from auth.users where id=r.user_id and is_anonymous=true;
  end loop;
  update private.parental_consents set status='deleted',deleted_at=clock_timestamp(),proof_cleanup_due_at=clock_timestamp()+interval '30 days' where status='revoked' and user_id is null and withdrawn_at<clock_timestamp()-interval '30 days';
  delete from private.parental_consents where status='deleted' and proof_cleanup_due_at<=clock_timestamp() and user_id is null;
end; $$;
-- No private helper or reviewer operation is a client API.
revoke all on all functions in schema private from public,anon,authenticated;
-- Existing event RLS calls this fixed, own-user membership predicate.
grant execute on function private.friend_is_member(uuid) to authenticated;

