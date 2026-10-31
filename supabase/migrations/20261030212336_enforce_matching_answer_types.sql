-- Answer choices must remain semantically homogeneous. A number question may
-- only show numbers, a legend question only names, and identity questions only
-- identities from the same scope. Competition remains the first preference for
-- club and winter-league packs.
create or replace function private.quiz_options(p_content_version text, p_item_id text, p_seed text)
returns jsonb
language sql
volatile
security definer
set search_path = ''
as $$
  with correct_item as (
    select item_id, display_name, metadata->>'scope' as scope,
      metadata->>'competitionKey' as competition_key
    from private.quiz_content
    where content_version = p_content_version and item_id = p_item_id
  ), distractors as (
    select q.item_id, q.display_name
    from private.quiz_content q
    cross join correct_item c
    where q.content_version = p_content_version
      and q.item_id <> p_item_id
      and q.display_name <> c.display_name
      and q.metadata->>'scope' is not distinct from c.scope
    order by
      case when coalesce(q.metadata->>'competitionKey', '') = coalesce(c.competition_key, '') then 0 else 1 end,
      md5(p_seed || ':' || q.item_id)
    limit 3
  ), picked as (
    select item_id, display_name from correct_item
    union all
    select item_id, display_name from distractors
  ), tokenized as (
    select item_id, display_name, extensions.gen_random_uuid() as choice_id
    from picked
  )
  select jsonb_build_object(
    'options', jsonb_agg(
      jsonb_build_object('id', choice_id, 'label', display_name)
      order by md5(p_seed || ':option:' || item_id)
    ),
    'correctChoiceId', (array_agg(choice_id) filter (where item_id = p_item_id))[1]
  )
  from tokenized
$$;

-- Rebuild only today's unplayed Basketball challenge. Attempts and their
-- persisted answer keys remain immutable for ranked integrity.
delete from public.daily_challenges challenge
where challenge.category_id = 'basketball'
  and challenge.challenge_date = private.utc_today()
  and not exists (
    select 1 from public.daily_attempts attempt where attempt.challenge_id = challenge.id
  );
