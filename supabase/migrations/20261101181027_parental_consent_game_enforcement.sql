-- Existing direct table access must not bypass withdrawal or the initial age gate.
revoke insert,update,delete on public.guest_profiles from anon,authenticated;
alter policy profiles_read_own on public.guest_profiles using ((select auth.uid())=user_id and (select public.has_online_access()));
alter policy attempts_read_own on public.daily_attempts using ((select auth.uid())=user_id and (select public.has_online_access()));
alter policy friend_events_read_members on public.friend_room_events using ((select public.has_online_access()) and private.friend_is_member(room_id));

-- Reuse the current game implementations while adding mandatory social permission
-- and excluding non-sharing accounts before rank calculation.
do $migrate$
declare r record; d text;
begin
  for r in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('create_friend_room','join_friend_room','get_friend_room_state','set_friend_ready','start_friend_match','submit_friend_answer','rematch_friend_room')
  loop
    d:=pg_get_functiondef(r.oid); d:=replace(d,'private.require_user()','private.require_social_user()'); execute d;
  end loop;
  select pg_get_functiondef('private.friend_state(uuid,boolean)'::regprocedure) into d;
  d:=replace(d,'private.require_user()','private.require_social_user()');
  d:=replace(d,'m.left_at is null','m.left_at is null and private.social_access_for(m.user_id)');
  d:=replace(d,'where p.match_id = v_match.id group by','where p.match_id = v_match.id and private.social_access_for(p.user_id) group by');
  d:=replace(d,'perform private.friend_reconcile(p_room_id);', 'if not private.social_access_for((select host_user_id from private.friend_rooms where id=p_room_id)) then raise exception ''This room is no longer available.''; end if; perform private.friend_reconcile(p_room_id);');
  execute d;
  select pg_get_functiondef('public.get_leaderboard(text,text,integer)'::regprocedure) into d;
  d:=replace(d,'a.status = ''completed''','a.status = ''completed'' and private.social_access_for(a.user_id)'); execute d;
end; $migrate$;

-- Child names are generated on the server, not accepted from free-form input.
create function private.child_nickname(p_user uuid) returns text language sql immutable set search_path = '' as $$
  select (array['Sunny','Brave','Lucky','Bubbly','Swift','Clever','Mighty','Happy'])[1+get_byte(extensions.digest(p_user::text,'sha256'),0)%8]
    ||' '||(array['Fox','Panda','Otter','Tiger','Koala','Lion'])[1+get_byte(extensions.digest(p_user::text,'sha256'),1)%6]
    ||' '||lpad(((get_byte(extensions.digest(p_user::text,'sha256'),2)*256+get_byte(extensions.digest(p_user::text,'sha256'),3))%10000)::text,4,'0')
$$;
do $nickname$
declare d text;
begin
  select pg_get_functiondef('public.sync_guest_profile(text,text,text)'::regprocedure) into d;
  d:=replace(d,'if char_length(p_display_name)', 'if exists(select 1 from private.online_access where user_id=v_user and kind=''child'') then p_display_name:=private.child_nickname(v_user); end if; if char_length(p_display_name)');
  execute d;
end; $nickname$;


revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.friend_is_member(uuid) to authenticated;

