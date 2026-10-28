-- Authenticated, read-only content contract for online Casual packs.
-- The private catalog remains inaccessible; this endpoint returns only the
-- identity metadata needed for local, unranked gameplay.
create or replace function public.get_casual_quiz_pack(p_category_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := private.require_user();
  v_content_version text;
  v_items jsonb;
begin
  select current_content_version
  into v_content_version
  from public.categories
  where id = p_category_id and is_active;

  if not found then
    raise exception 'Unsupported quiz.' using errcode = '22023';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', item_id,
        'displayName', display_name,
        'assetPath', asset_path,
        'difficulty', difficulty,
        'contentType', metadata->>'scope'
      ) order by item_id
    ),
    '[]'::jsonb
  )
  into v_items
  from private.quiz_content
  where category_id = p_category_id
    and content_version = v_content_version;

  if jsonb_array_length(v_items) < 4 then
    raise exception 'The quiz pack is not currently playable.' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'categoryId', p_category_id,
    'contentVersion', v_content_version,
    'items', v_items
  );
end;
$$;

revoke all on function public.get_casual_quiz_pack(text) from public, anon;
grant execute on function public.get_casual_quiz_pack(text) to authenticated;

comment on function public.get_casual_quiz_pack(text) is
  'Returns active unranked quiz identities and asset paths; ranked round choices and answer keys remain private.';
