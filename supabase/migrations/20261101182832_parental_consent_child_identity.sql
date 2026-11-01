-- Children cannot use custom public names/avatars or request ad reward references.
do $safety$
declare d text;
begin
  select pg_get_functiondef('public.sync_guest_profile(text,text,text)'::regprocedure) into d;
  d:=replace(d,'p_display_name:=private.child_nickname(v_user);','p_display_name:=private.child_nickname(v_user); p_avatar:=''🐨''; p_avatar_color:=''#74B9FF'';'); execute d;
  select pg_get_functiondef('public.claim_parental_consent(text,text)'::regprocedure) into d;
  d:=replace(d,'update private.parental_consents set user_id=v_user,',
    'if exists(select 1 from private.online_access where user_id=v_user and kind=''adult'') then perform private.clear_friend_data(v_user); end if; update public.guest_profiles set display_name=private.child_nickname(v_user),avatar=''🐨'',avatar_color=''#74B9FF'' where user_id=v_user; update private.parental_consents set user_id=v_user,'); execute d;
end; $safety$;

