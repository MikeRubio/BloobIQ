create function private.clear_friend_data(p_user uuid) returns void language plpgsql security definer set search_path = '' as $$
declare v_room uuid;
begin
  delete from private.friend_rooms where host_user_id=p_user;
  for v_room in select room_id from private.friend_room_members where user_id=p_user loop
    insert into public.friend_room_events(room_id,kind) values(v_room,'left');
  end loop;
  delete from private.friend_match_players where user_id=p_user;
  delete from private.friend_room_members where user_id=p_user;
  delete from private.friend_rate_events where user_id=p_user;
end; $$;

revoke all on function private.clear_friend_data(uuid) from public,anon,authenticated;
