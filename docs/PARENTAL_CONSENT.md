# BloopIQ parental consent operations

Implemented 1 November 2026. Publisher: Miguel Rubio, Cana Dulce #2, El Millón, República Dominicana; +1 809 696 1531; feherkartya@gmail.com.

## Method and scope

All under-18 players need a parent/legal guardian's **signed form reviewed by the publisher**, before an online guest/profile is created. A handwritten form returned by post or electronic scan is a verifiable-consent method described by the FTC's COPPA guidance. This implementation does not claim that a child ticking a box, an age declaration, device possession or a publisher clicking Approve is parental verification. Human review of the signed evidence is an ongoing operating responsibility.

Adults acknowledge the versioned notice. Unknown, offline and pending under-18 players have bundled offline Flags without profile synchronization, hosted quiz downloads or ad initialization. No birth date or child email is requested. Pending children check approval explicitly; approved children recheck on restart/foreground and every minute while active. Game RPCs enforce approval, expiry and optional sharing on every request. Production ads remain disabled; the client and reward-reference RPC exclude under-18 players even in ad-enabled test builds.

Notice version: `2026-11-01-v1`. A material practice change requires a new notice version, renewed parental approval and adult acknowledgement; changing public wording alone does not obtain consent.

- Policy: https://bloopiq-privacy.merry-coin-3817.chatgpt.site/
- Direct notice and printable form: https://bloopiq-privacy.merry-coin-3817.chatgpt.site/parent-consent.html
- Parent controls: https://bloopiq-privacy.merry-coin-3817.chatgpt.site/parent-controls.html

## Child and parent steps

1. In the app, select Under 18, then Share/Open parent form. The app generates a private random 256-bit request code locally. Request links use a URL fragment, which is removed on page load. Do not publish a request code.
2. The parent reads the direct notice/policy, prints the form, supplies their own name/email, checks core consent and signs/dates it. The separate optional sharing choice can remain blank; private Daily is still available.
3. The parent sends a scan/photo from their own email account to feherkartya@gmail.com, or posts the signed form to the address above. Do not request passports, IDs, child photos or full birth dates.
4. The publisher reviews and records approval using the restricted procedure below. Approval is not automatic. Incomplete or doubtful requests remain offline.
5. The parent receives a separate private control link at the verified parent email. **Never send that control link to the child or place it in the app.**
6. On the child's device, Check parent approval binds the approval to that guest identity once. One approval cannot be claimed by a second guest. A lost/uninstalled guest session needs a new request/form; do not reassign an existing child's data based on a nickname.

## Publisher review and approval

Use a private publisher mailbox protected with MFA, and restrict access to signed forms. Do not put signed forms, parent contact details, control codes, real request codes, or credentials in Git, public Storage, logs, tickets or screenshots.

Review the actual document: legible parent name/email, the correct 64-character app request code, current notice version, required core checkbox, handwritten signature and date within the last 30 days. Confirm the sender is the parent claiming responsibility and check the document/correspondence for inconsistencies. A self-declaration by a child is not enough. If authority or authenticity is doubtful, seek proportionate clarification from the adult or refuse approval; keep the game offline. Do not approve solely because the database accepts the parameters. The optional sharing checkbox must be explicit; otherwise use `false`.

Hash the actual signed document using SHA-256. On Windows:

```powershell
(Get-FileHash -Algorithm SHA256 -LiteralPath 'C:\Private\signed-consent.pdf').Hash.ToLowerInvariant()
```

In Supabase SQL Editor, signed in as the publisher administrator, call the private function with **real reviewed values**. Replace the placeholders; never use these example strings as approval evidence:

```sql
select private.approve_parental_consent(
  p_request_secret => '<64-character code from the child app/form>',
  p_parent_name => '<verified parent/legal guardian name>',
  p_parent_email => '<verified parent email>',
  p_document_hash => '<64-character SHA-256 of the signed document>',
  p_proof_reference => '<private mailbox/document reference, no public link>',
  p_sharing_allowed => false, -- true only with separate explicit sharing consent
  p_signed_at => '<signed date in ISO 8601 format>'::timestamptz
);
```

The function returns `consentId`, `expiresAt` and a new `parentControlCode` once. Only hashes of the request/control codes are stored. Send the parent this link in a private reply to their verified email:

```text
https://bloopiq-privacy.merry-coin-3817.chatgpt.site/parent-controls.html#<parentControlCode>
```

Include the notice version, annual expiry, sharing choice, child-device Check approval instruction and publisher contact. This document does not send email automatically. Restrict SQL Editor and service-role access to the publisher; clients cannot read consent evidence or call approval. The public Edge Function verifies the appropriate high-entropy capability in the request body. It never accepts a consent boolean from a child as approval, never exposes the service-role key and does not log submitted codes/bodies or exported child data.

## Parent controls, recovery and renewal

The parent-control page provides data review/download, independent sharing on/off, withdrawal and permanent account deletion. The request code cannot access parent controls. Core consent and public sharing are independent; turning sharing off hides the child's rankings and removes Friends participation while keeping private Daily play.

Withdrawal blocks online game RPCs immediately and removes Friends participation. The child can continue bundled offline Flags. Parent deletion also hard-deletes Supabase Auth and invalidates protected RPC access; local offline records on the device are separate and can be reset through Settings or device app-data controls. Account deletion remains available without an active online approval.

Approval expires after one year. For renewal, the parent supplies a fresh signed form using Prepare/renew parent form. Review it again and call the same private approval function with the new signed-document hash and date. An existing bound request code stays associated with its guest; renewal rotates the parent-control code and invalidates the old link. Send the new link only to the verified parent. Remove superseded signed evidence within 30 days of renewal. A deleted guest needs a new code/form. For a lost parent-control link, verify the parent through a fresh signed form/correspondence before reissuing access; never reset access based on a public nickname or an unverified email alone.

## Retention and daily publisher work

- Unapproved local requests expire after 30 days; Prepare/renew generates a fresh code unless already linked to an approved guest. Delete incomplete/refused correspondence within 30 days if it is no longer needed to resolve the request.
- An hourly `bloopiq-parent-consent-retention` database job revokes expired approval, removes Friends data, deletes withdrawn/expired child game accounts after 30 days and removes closed verification metadata after its 30-day cleanup date. Unclaimed expired approvals are also cleaned up. Server expiry checks are immediate even before the next cron run.
- **The database cannot delete your Gmail/postal records.** Check the following private queue daily, remove the corresponding signed forms/email attachments/postal copies within 30 days after closure, including recoverable trash and private copies you control, and remove superseded renewal evidence within 30 days. Do not keep forms indefinitely merely because a hash exists.

```sql
select id, parent_email, proof_reference, status, expires_at,
       deleted_at, proof_cleanup_due_at
from private.parental_consents
where status = 'deleted'
order by proof_cleanup_due_at;
```

- If closure/parent requests happen by email, verify authority and use the existing private controls or the authenticated deletion route. Do not delete another guest just because someone knows a nickname/account UUID.
- Review Supabase cron run results for the named job and Edge Function errors. Error logs must not include parent/control codes or request bodies. If cleanup fails, repair/retry promptly; automation does not remove the publisher's retention obligation.
- Logs/provider backups have separate lifecycles; do not restore deleted child records to active use. Parent support messages are not marketing contacts.

## Verification and store disclosures

On 1 November 2026, 23 live HTTP checks passed using isolated synthetic adult/child guests. Tests covered unapproved JWT rejection, notice acknowledgement, private child approval, server-generated identities, optional sharing/Friends, child self-upgrade rejection, capability separation, parent export, withdrawal, Auth deletion and foreign-origin rejection. Synthetic Auth accounts were deleted; the closed synthetic consent metadata follows the normal proof-retention schedule. Transaction-only database checks additionally covered one-account claim binding, private/public leaderboard visibility, ad-reference rejection, annual expiry and retention cleanup, then rolled back. All four database suites passed: 158 pgTAP assertions, with additional explicit consent assertions. No real parent's consent was invented for testing.

The release remains Flags only with production ads off. App Store privacy answers and Play Data safety must include **parent name/email and consent correspondence/evidence**, guest identifiers, gameplay and applicable diagnostics/security processing; absence of registration does not mean no data collection. Complete the actual audience/Families/Kids declarations accurately. Do not select Apple's Kids Category solely because this flow exists; its separate requirements need review.

Physical iPhone/iPad/Android acceptance and signed store archives remain separate from TypeScript, Metro bundles and server tests. Test the exact candidate: first launch, offline decline, adult acknowledgement, under-18 pending/check, parent approval, relaunch, private Daily, sharing on/off, withdrawal in an active room, deletion, annual-expiry test fixture, network timeout, large text and back navigation. Do not label those device checks passed without running them.

References: FTC COPPA FAQ https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions and six-step plan https://www.ftc.gov/business-guidance/resources/childrens-online-privacy-protection-rule-six-step-compliance-plan-your-business. Implementation and testing do not guarantee legal compliance in every jurisdiction or store approval.
