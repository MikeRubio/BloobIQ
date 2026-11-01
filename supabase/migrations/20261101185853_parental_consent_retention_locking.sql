-- Tighten the existing maintenance function's concurrency checks only; this migration does not run cleanup.
do $lock$
declare d text;
begin
  select pg_get_functiondef('private.expire_parental_consents()'::regprocedure) into d;
  d:=replace(d,'where id=r.id;', 'where id=r.id and status=''approved'' and expires_at<=clock_timestamp();');
  d:=replace(d,'if r.user_id is not null then perform private.clear_friend_data', 'if found and r.user_id is not null then perform private.clear_friend_data');
  d:=replace(d,'for r in select user_id from private.parental_consents', 'for r in select id,user_id from private.parental_consents');
  d:=replace(d,'perform private.clear_guest_data(r.user_id);', 'perform pg_advisory_xact_lock(hashtextextended(''online-access:''||r.user_id::text,0)); perform 1 from private.parental_consents where id=r.id and status=''revoked'' and withdrawn_at<clock_timestamp()-interval ''30 days'' for update; if not found then continue; end if; perform private.clear_guest_data(r.user_id);');
  execute d;
end; $lock$;
