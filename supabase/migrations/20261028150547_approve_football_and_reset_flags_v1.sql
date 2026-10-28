-- Record the project owner's review of the current Football identity pack and
-- remove pre-production Flags v1 challenges/attempts so the current UTC day is
-- regenerated from flags-195-v1 on the next request.

alter table private.quiz_content
  drop constraint quiz_content_rights_status;

alter table private.quiz_content
  add constraint quiz_content_rights_status check (
    rights_status in (
      'public_domain_national_symbol',
      'trademark_review_required',
      'trademark_reviewed_approved'
    )
  );

update private.quiz_content
set
  rights_status = 'trademark_reviewed_approved',
  attribution = 'Trademark use reviewed and approved by project owner for pre-production quiz use (2026-10-28)'
where category_id = 'football' and content_version = 'football-v1';

delete from public.daily_attempts a
using public.daily_challenges c
where a.challenge_id = c.id
  and c.category_id = 'flags'
  and c.content_version = 'flags-v1';

delete from public.daily_challenges
where category_id = 'flags' and content_version = 'flags-v1';

delete from private.quiz_content
where category_id = 'flags' and content_version = 'flags-v1';

delete from private.flag_content
where content_version = 'flags-v1';

do $$
begin
  if exists (select 1 from private.quiz_content where rights_status = 'trademark_review_required') then
    raise exception 'all current trademark identities must be reviewed';
  end if;
  if (select count(*) from private.quiz_content where content_version = 'football-v1' and rights_status = 'trademark_reviewed_approved') <> 17 then
    raise exception 'all 17 football identities must be approved';
  end if;
  if exists (select 1 from public.daily_challenges where category_id = 'flags' and content_version = 'flags-v1') then
    raise exception 'flags-v1 challenges must be removed';
  end if;
end;
$$;
