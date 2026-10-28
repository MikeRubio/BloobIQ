create or replace function public.create_friend_room(p_category_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := private.require_user(); v_room uuid; v_code text; v_i integer;
begin
  perform private.friend_rate_limit(v_user, 'create', 5, interval '10 minutes');
  if not exists (select 1 from public.categories where id = p_category_id and is_active) then raise exception 'Unsupported category.'; end if;
  if not exists (select 1 from public.guest_profiles where user_id = v_user) then raise exception 'Profile must be synced first.'; end if;
  loop
    v_code := '';
    for v_i in 1..6 loop
      v_code := v_code || substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::integer, 1);
    end loop;
    begin
      insert into private.friend_rooms(code, category_id, host_user_id) values (v_code, p_category_id, v_user) returning id into v_room;
      exit;
    exception when unique_violation then null;
    end;
  end loop;
  insert into private.friend_room_members(room_id, user_id, display_name, avatar, avatar_color)
    select v_room, user_id, display_name, avatar, avatar_color from public.guest_profiles where user_id = v_user;
  perform private.friend_emit(v_room, 'member');
  return private.friend_state(v_room);
end;
$$;

revoke all on function public.create_friend_room(text) from public, anon;
grant execute on function public.create_friend_room(text) to authenticated;
