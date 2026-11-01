-- These capability endpoints are called only by the Edge Function's service role.
create function public.parent_consent_status(p_request_secret text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare c private.parental_consents%rowtype;
begin
  if p_request_secret !~ '^[a-f0-9]{64}$' then return jsonb_build_object('approved',false); end if;
  select * into c from private.parental_consents where request_hash=encode(extensions.digest(p_request_secret,'sha256'),'hex');
  if not found then return jsonb_build_object('approved',false); end if;
  return jsonb_build_object('approved',c.status='approved' and c.expires_at>clock_timestamp() and c.notice_version=private.parent_notice_version(),
    'sharingAllowed',c.sharing_allowed,'expiresAt',c.expires_at,'noticeVersion',c.notice_version);
end; $$;
create function public.parent_consent_control(p_parent_secret text,p_action text,p_sharing boolean default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c private.parental_consents%rowtype; v_data jsonb; v_user uuid;
begin
  if p_parent_secret !~ '^[a-f0-9]{64}$' or p_action not in ('review','withdraw','delete','sharing') then raise exception 'Invalid parent control request.' using errcode='42501'; end if;
  select * into c from private.parental_consents where parent_token_hash=encode(extensions.digest(p_parent_secret,'sha256'),'hex');
  if not found then raise exception 'The parent control code is invalid or has expired.' using errcode='42501'; end if;
  v_user:=c.user_id;
  if v_user is not null then perform pg_advisory_xact_lock(hashtextextended('online-access:'||v_user::text,0)); end if;
  select * into c from private.parental_consents where id=c.id for update;
  if p_action='delete' then
    if v_user is not null then perform private.clear_guest_data(v_user);
    else update private.parental_consents set status='deleted',deleted_at=coalesce(deleted_at,clock_timestamp()),proof_cleanup_due_at=coalesce(proof_cleanup_due_at,clock_timestamp()+interval '30 days') where id=c.id; end if;
    return jsonb_build_object('deleted',true,'deleteUserId',v_user,'proofCleanupWithinDays',30);
  end if;
  if c.status='deleted' then return jsonb_build_object('status','deleted','proofCleanupDueAt',c.proof_cleanup_due_at); end if;
  if p_action='withdraw' then
    update private.parental_consents set status='revoked',withdrawn_at=coalesce(withdrawn_at,clock_timestamp()),sharing_allowed=false where id=c.id;
    if v_user is not null then perform private.clear_friend_data(v_user); end if;
  elsif p_action='sharing' then
    if p_sharing is null or c.status<>'approved' or c.expires_at<=clock_timestamp() then raise exception 'Current parental approval is required.'; end if;
    update private.parental_consents set sharing_allowed=p_sharing where id=c.id;
    if not p_sharing and v_user is not null then perform private.clear_friend_data(v_user); end if;
  end if;
  select * into c from private.parental_consents where id=c.id;
  select jsonb_build_object(
    'profile',(select to_jsonb(p) from public.guest_profiles p where p.user_id=v_user),
    'dailyAttempts',coalesce((select jsonb_agg(to_jsonb(a)) from public.daily_attempts a where a.user_id=v_user),'[]'::jsonb),
    'dailyAnswers',coalesce((select jsonb_agg(to_jsonb(d)) from public.daily_answers d join public.daily_attempts a on a.id=d.attempt_id where a.user_id=v_user),'[]'::jsonb),
    'friendsMemberships',coalesce((select jsonb_agg(to_jsonb(m)) from private.friend_room_members m where m.user_id=v_user),'[]'::jsonb),
    'friendsResults',coalesce((select jsonb_agg(to_jsonb(p)) from private.friend_match_players p where p.user_id=v_user),'[]'::jsonb)
  ) into v_data;
  return jsonb_build_object('status',c.status,'sharingAllowed',c.sharing_allowed,'expiresAt',c.expires_at,
    'noticeVersion',c.notice_version,'data',v_data);
end; $$;
revoke all on function public.parent_consent_status(text),public.parent_consent_control(text,text,boolean) from public,anon,authenticated;
grant execute on function public.parent_consent_status(text),public.parent_consent_control(text,text,boolean) to service_role;


revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.friend_is_member(uuid) to authenticated;

