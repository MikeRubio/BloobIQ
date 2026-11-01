-- All game access is now explicit. Under-18 approval uses a signed form reviewed
-- by the publisher. Request codes and parent-control codes are separate 256-bit
-- capabilities; only hashes are stored, and approval is never client-writable.
create table private.parental_consents (
  id uuid primary key default extensions.gen_random_uuid(),
  request_hash text not null unique check (request_hash ~ '^[a-f0-9]{64}$'),
  parent_token_hash text not null unique check (parent_token_hash ~ '^[a-f0-9]{64}$'),
  parent_name text not null check (char_length(parent_name) between 2 and 120),
  parent_email text not null check (parent_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' and char_length(parent_email) <= 254),
  document_hash text not null unique check (document_hash ~ '^[a-f0-9]{64}$'),
  proof_reference text not null check (char_length(proof_reference) between 4 and 200),
  notice_version text not null,
  sharing_allowed boolean not null default false,
  status text not null default 'approved' check (status in ('approved','revoked','deleted')),
  signed_at timestamptz not null,
  approved_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  user_id uuid unique references auth.users(id) on delete set null,
  claimed_at timestamptz,
  withdrawn_at timestamptz,
  deleted_at timestamptz,
  proof_cleanup_due_at timestamptz
);
create index parental_consents_expiry_idx on private.parental_consents(expires_at) where status = 'approved';
create index parental_consents_cleanup_idx on private.parental_consents(proof_cleanup_due_at) where status = 'deleted';
create table private.online_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kind text not null check (kind in ('adult','child')),
  consent_id uuid references private.parental_consents(id) on delete restrict,
  notice_version text not null,
  accepted_at timestamptz not null default clock_timestamp(),
  check ((kind = 'adult' and consent_id is null) or (kind = 'child' and consent_id is not null))
);
create index online_access_consent_idx on private.online_access(consent_id) where consent_id is not null;
alter table private.parental_consents enable row level security;
alter table private.online_access enable row level security;
revoke all on private.parental_consents, private.online_access from public, anon, authenticated;


