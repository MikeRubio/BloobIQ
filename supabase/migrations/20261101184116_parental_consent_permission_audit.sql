alter table private.parental_consents
  add column sharing_updated_at timestamptz not null default clock_timestamp(),
  add column sharing_source text not null default 'signed-form' check(sharing_source in ('signed-form','parent-controls'));
do $audit$
declare d text;
begin
  select pg_get_functiondef('private.approve_parental_consent(text,text,text,text,text,boolean,timestamptz)'::regprocedure) into d;
  d:=replace(d,'sharing_allowed=excluded.sharing_allowed,signed_at=', 'sharing_allowed=excluded.sharing_allowed,sharing_updated_at=clock_timestamp(),sharing_source=''signed-form'',signed_at='); execute d;
  select pg_get_functiondef('public.parent_consent_control(text,text,boolean)'::regprocedure) into d;
  d:=replace(d,'set sharing_allowed=p_sharing where', 'set sharing_allowed=p_sharing,sharing_updated_at=clock_timestamp(),sharing_source=''parent-controls'' where');
  d:=replace(d,'''sharingAllowed'',c.sharing_allowed,''expiresAt''','''sharingAllowed'',c.sharing_allowed,''sharingUpdatedAt'',c.sharing_updated_at,''sharingSource'',c.sharing_source,''expiresAt'''); execute d;
end; $audit$;

