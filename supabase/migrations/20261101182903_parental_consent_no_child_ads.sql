create function private.require_adult_user() returns uuid language plpgsql security invoker set search_path='' as $$
declare u uuid:=private.require_user();
begin
  if not exists(select 1 from private.online_access where user_id=u and kind='adult') then
    raise exception 'Advertising is unavailable for under-18 players.' using errcode='42501';
  end if; return u;
end; $$;
revoke all on function private.require_adult_user() from public,anon,authenticated;
do $ads$
declare d text;
begin
  select pg_get_functiondef('public.issue_ad_reward_reference(uuid,text)'::regprocedure) into d;
  d:=replace(d,'private.require_user()','private.require_adult_user()'); execute d;
end; $ads$;

