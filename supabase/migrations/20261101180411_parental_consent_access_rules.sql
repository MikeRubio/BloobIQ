create function private.parent_notice_version() returns text language sql immutable set search_path = ''
as $$ select '2026-11-01-v1'::text $$;
create function private.require_auth_session() returns uuid language plpgsql stable security invoker set search_path = '' as $$
declare v_user uuid := auth.uid(); v_session uuid := nullif(auth.jwt()->>'session_id','')::uuid;
begin
  if v_user is null or not exists(select 1 from auth.users where id=v_user) then
    raise exception 'Authentication required.' using errcode='28000';
  end if;
  if v_session is not null and not exists(select 1 from auth.sessions where id=v_session and user_id=v_user) then
    raise exception 'Session is no longer valid.' using errcode='28000';
  end if;
  return v_user;
end; $$;
create function private.online_access_for(p_user uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.online_access a
    left join private.parental_consents c on c.id=a.consent_id
    where a.user_id=p_user and a.notice_version=private.parent_notice_version()
      and (a.kind='adult' or (c.status='approved' and c.expires_at>now()
        and c.user_id=p_user and c.notice_version=private.parent_notice_version())))
$$;
create function private.social_access_for(p_user uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select private.online_access_for(p_user) and exists(select 1 from private.online_access a
    left join private.parental_consents c on c.id=a.consent_id
    where a.user_id=p_user and (a.kind='adult' or c.sharing_allowed))
$$;
create function public.has_online_access() returns boolean language plpgsql stable security definer set search_path = '' as $$
declare v_user uuid;
begin
  v_user := private.require_auth_session();
  return private.online_access_for(v_user);
exception when sqlstate '28000' then return false;
end; $$;
revoke all on function public.has_online_access() from public,anon;
grant execute on function public.has_online_access() to authenticated;
create or replace function private.require_user() returns uuid language plpgsql volatile security invoker set search_path = '' as $$
declare v_user uuid := private.require_auth_session();
begin
  perform pg_advisory_xact_lock_shared(hashtextextended('online-access:'||v_user::text,0));
  if not private.online_access_for(v_user) then
    raise exception 'Online permission is required. Open Online access in Settings.' using errcode='42501';
  end if;
  return v_user;
end; $$;
create function private.require_social_user() returns uuid language plpgsql volatile security invoker set search_path = '' as $$
declare v_user uuid := private.require_user();
begin
  if not private.social_access_for(v_user) then
    raise exception 'A parent must enable public rankings and Friends rooms first.' using errcode='42501';
  end if;
  return v_user;
end; $$;


revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.friend_is_member(uuid) to authenticated;

