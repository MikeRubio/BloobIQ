create function public.get_online_access_state() returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := private.require_auth_session(); v_kind text; v_expiry timestamptz;
begin
  select a.kind,c.expires_at into v_kind,v_expiry from private.online_access a
    left join private.parental_consents c on c.id=a.consent_id where a.user_id=v_user;
  return jsonb_build_object('onlineAllowed',private.online_access_for(v_user),
    'sharingAllowed',private.social_access_for(v_user),'kind',v_kind,'expiresAt',v_expiry,
    'noticeVersion',private.parent_notice_version());
end; $$;
create function public.register_adult_online_access(p_notice_version text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := private.require_auth_session();
begin
  perform pg_advisory_xact_lock(hashtextextended('online-access:'||v_user::text,0));
  if p_notice_version<>private.parent_notice_version() then raise exception 'Read the current privacy notice first.'; end if;
  if exists(select 1 from private.online_access where user_id=v_user and kind='child') then
    raise exception 'A child account cannot replace parental approval with an adult declaration.' using errcode='42501';
  end if;
  insert into private.online_access(user_id,kind,notice_version) values(v_user,'adult',p_notice_version)
    on conflict(user_id) do update set notice_version=excluded.notice_version,accepted_at=clock_timestamp();
  return public.get_online_access_state();
end; $$;
create function public.claim_parental_consent(p_request_secret text,p_notice_version text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := private.require_auth_session(); v_consent private.parental_consents%rowtype;
begin
  if p_request_secret !~ '^[a-f0-9]{64}$' or p_notice_version<>private.parent_notice_version() then raise exception 'Invalid permission request.'; end if;
  perform pg_advisory_xact_lock(hashtextextended('online-access:'||v_user::text,0));
  select * into v_consent from private.parental_consents
    where request_hash=encode(extensions.digest(p_request_secret,'sha256'),'hex') for update;
  if not found or v_consent.status<>'approved' or v_consent.expires_at<=clock_timestamp()
    or v_consent.notice_version<>p_notice_version then raise exception 'No current parental approval was found.' using errcode='42501'; end if;
  if v_consent.claimed_at is not null and v_consent.user_id is distinct from v_user then
    raise exception 'This approval is already linked to another guest account.' using errcode='42501';
  end if;
  if exists(select 1 from private.online_access where user_id=v_user and consent_id is not null and consent_id<>v_consent.id) then
    raise exception 'This guest already has a different parental approval.' using errcode='42501';
  end if;
  update private.parental_consents set user_id=v_user,claimed_at=coalesce(claimed_at,clock_timestamp()) where id=v_consent.id;
  insert into private.online_access(user_id,kind,consent_id,notice_version) values(v_user,'child',v_consent.id,p_notice_version)
    on conflict(user_id) do update set kind='child',consent_id=excluded.consent_id,notice_version=excluded.notice_version,accepted_at=clock_timestamp();
  return public.get_online_access_state();
end; $$;
revoke all on function public.get_online_access_state(), public.register_adult_online_access(text),public.claim_parental_consent(text,text) from public,anon;
grant execute on function public.get_online_access_state(), public.register_adult_online_access(text),public.claim_parental_consent(text,text) to authenticated;


revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.friend_is_member(uuid) to authenticated;

