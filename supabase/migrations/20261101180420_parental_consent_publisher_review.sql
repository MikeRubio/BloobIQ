-- Only a publisher using the SQL editor/server role can approve a reviewed form.
-- Returns the parent's private control code once. It must not be given to a child.
create function private.approve_parental_consent(p_request_secret text,p_parent_name text,p_parent_email text,
  p_document_hash text,p_proof_reference text,p_sharing_allowed boolean,p_signed_at timestamptz)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_parent_token text := encode(extensions.gen_random_bytes(32),'hex'); v_id uuid; v_existing private.parental_consents%rowtype;
begin
  if p_request_secret !~ '^[a-f0-9]{64}$' or p_document_hash !~ '^[a-f0-9]{64}$'
    or p_signed_at<clock_timestamp()-interval '30 days' or p_signed_at>clock_timestamp()+interval '1 day' then
    raise exception 'A current signed form and valid request/document hashes are required.';
  end if;
  select * into v_existing from private.parental_consents where request_hash=encode(extensions.digest(p_request_secret,'sha256'),'hex') for update;
  if found and v_existing.status='deleted' then raise exception 'A deleted account needs a new request code and form.'; end if;
  insert into private.parental_consents(request_hash,parent_token_hash,parent_name,parent_email,document_hash,proof_reference,
    notice_version,sharing_allowed,signed_at,expires_at)
  values(encode(extensions.digest(p_request_secret,'sha256'),'hex'),encode(extensions.digest(v_parent_token,'sha256'),'hex'),
    trim(p_parent_name),lower(trim(p_parent_email)),p_document_hash,p_proof_reference,private.parent_notice_version(),p_sharing_allowed,p_signed_at,clock_timestamp()+interval '1 year')
  on conflict(request_hash) do update set parent_token_hash=excluded.parent_token_hash,parent_name=excluded.parent_name,
    parent_email=excluded.parent_email,document_hash=excluded.document_hash,proof_reference=excluded.proof_reference,
    notice_version=excluded.notice_version,sharing_allowed=excluded.sharing_allowed,signed_at=excluded.signed_at,
    approved_at=clock_timestamp(),expires_at=excluded.expires_at,status='approved',withdrawn_at=null
  returning id into v_id;
  return jsonb_build_object('consentId',v_id,'parentControlCode',v_parent_token,'expiresAt',clock_timestamp()+interval '1 year');
end; $$;


revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.friend_is_member(uuid) to authenticated;

