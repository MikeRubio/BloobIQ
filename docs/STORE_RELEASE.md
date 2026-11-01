# BloopIQ store release readiness

Updated for the parental-consent release milestone on 1 November 2026.

## Product decisions

The first store release contains country flags only. Casual, Daily, rankings and private Friends rooms remain supported for Flags. Football, baseball, basketball, brands, history and celebrities stay available in full-catalogue development builds while their production artwork rights are unresolved. No rights-status records have been relabelled as approved.

The audience remains **all ages with online play**. The under-18 parental flow is now implemented: a neutral age choice, offline play before approval, reviewed signed parental forms, private parent controls, independent public-sharing permission, server-enforced withdrawal/deletion and annual renewal. See [PARENTAL_CONSENT.md](PARENTAL_CONSENT.md) for the publisher's review procedure and evidence-retention duties. No paid identity provider is required; this is a manual signed-form process and real approvals require actual publisher review.

`config/store-release.json` records the implemented version and verification evidence. It does not certify universal legal compliance or store acceptance. Signed builds, device acceptance, audience declarations and store-account paperwork still require the checks below.

## Release catalogue enforcement

- Both `testflight` and `production` explicitly set `EXPO_PUBLIC_RELEASE_CATALOG=flags-only`. Android internal testing inherits that setting.
- Home, quiz navigation, mode selectors, rankings, records and saved Quick Play only expose allowed quizzes.
- Non-flag deep links fall back to Flags. Backend adapters reject non-flag requests, and an unsupported room joined by code is left before exposing its content.
- Startup and Friends warming only fetch allowed flag assets.
- The production content-rights check evaluates the effective catalogue: 195 flag entries pass; 601 other entries remain excluded. Setting the full catalogue still fails the rights check.
- The public-release gate requires the versioned parental flow, its documentation and disabled production advertising, alongside the Flags rights check.

## Live backend verification

The account-deletion migration and `delete-account` function are deployed. The committed migration filename was aligned with the deployed timestamp `20261101144656`; normalized SQL hashes matched exactly, so no duplicate migration was applied.

A temporary guest was created for verification, synced, and used to create an owned Flags room. The live deletion function rejected missing confirmation with HTTP 400, accepted explicit confirmation with HTTP 200, and deleted the account and owned room. The former access token was rejected by a protected RPC and its refresh token was rejected. Database checks confirmed no remaining test auth user, session, profile or hosted room. No existing player data was changed by that test.

The deletion function authenticates the caller server-side and performs a hard Auth deletion after application cleanup. Moderation tables and RPC are deployed, and canonical profile and Friends name constraints both allow 3–32 and 1–32 characters respectively.

## Advertising and permissions

Production ads default off in `eas.json` and the runtime stops before UMP/SDK initialization when disabled. When deliberately enabled after review, the adapter configures child-directed/under-age treatment, G-rated ad content and non-personalized requests. These settings are not a declaration of children's privacy compliance.

Native generation was checked for the absence of iOS microphone purpose text and background audio. Android recording, advertising-ID, external-storage and overlay permissions are explicitly removed. Final Android merged manifests and iOS archives still need verification in signed builds.

## Internal QA

Use adult testers for initial candidate QA. Test under-18 flows with clearly marked synthetic fixtures; real child online access requires the signed-parent procedure. A public beta does not bypass audience or privacy requirements.

From the project checkout:

```sh
npm ci
npm run preflight
npm run deploy:ios:testflight
```

This builds and uploads the flags-only iOS test profile. Select the correct Apple team, test build and internal adult tester group. A Metro server and UDID registration are not required for TestFlight store distribution. Test ads are used in this profile; it is not the public production advertising configuration.

For an Android App Bundle for Play internal testing:

```sh
npm run build:android:internal
```

Download its `.aab` from EAS, upload it to Google Play Console's Internal testing track, complete the requested declarations, and share only with the intended adult testers. The existing preview profile remains available for APK testing but is a full-catalogue development/preview configuration; use the internal store profile to verify the flags-only release scope.

Verify EAS preview and production environments contain the correct public backend URL and publishable key. Never put secret/service-role credentials into public variables. Production configuration still expects the four configured AdMob IDs even while advertising is disabled.

## Public deployment gate

```sh
npm run check:release-content-rights -- --force
npm run check:store-release -- --force
```

Both checks now pass for the implemented Flags-only, ads-disabled release configuration. Create production candidates using `npm run build:ios:production` and `npm run build:android:production`; test the exact signed candidates before submission.

## Public URLs

- Privacy and current release status: https://bloopiq-privacy.merry-coin-3817.chatgpt.site/
- Support: https://bloopiq-privacy.merry-coin-3817.chatgpt.site/support.html
- Outside-the-app deletion instructions/request: https://bloopiq-privacy.merry-coin-3817.chatgpt.site/delete-account.html

The policy effective 1 November 2026 covers the implemented parent flow, parental contact/consent evidence, guest/game processing, deletion, disabled production ads, retention, service providers and rights. It includes the publisher's supplied Dominican Republic address and telephone. The direct parent notice and controls are linked from the policy, support and deletion pages. A nickname or unverified email alone does not establish authority over another guest.

## Store account and signed-build checks still required

App Store Connect: include parent name/email and signed-consent correspondence in the privacy assessment, then confirm bundle ID `com.guessr.game`, agreements, age-rating questionnaire, accurate privacy labels, current public policy/support URLs, content-rights declarations, real iPhone/iPad screenshots, review contacts/notes, and EU trader status. Inspect the signed archive and privacy manifest aggregation; complete Apple upload validation. Use the SDK 58 EAS image configured in the profile and verify the actual Xcode/iOS SDK versions in the build log.

Google Play: include parent name/email and consent correspondence/evidence in Data safety, then confirm package `com.guessr.game`, app signing, unique version code, Android target SDK requirement, final merged permissions, native-library 16 KB page-size compatibility, Data safety, account-deletion URL, ads declaration, target audience/Families requirements where applicable, IARC rating, store assets/support details and any account-specific production-testing requirements. Answer disclosures for actual bundled SDK behavior and the all-ages online data model, not solely the lack of a login form.

Both platforms: verify cold launch, flags imagery, Daily start/submission/rankings, two-device room creation/joining/reconnects, Report & Block, account deletion/cancellation/failure, offline error/retry, background/foreground timing, sound restoration, accessibility text sizes and iPad layout. Signed native builds, store forms, legal audience review and physical-device acceptance are not established by Metro exports or unit tests.

## Validation

- `npm run check`: 130 tests, TypeScript, lint and branding checks passed.
- Expo Doctor: 20/20.
- iOS and Android Flags-only Metro exports passed; these are not signed archives.
- 23 live HTTP checks passed with synthetic guests, including real Auth deletion and rejection of former JWTs. Parent public endpoint/CORS also passed without an API key.
- All four database suites passed in rollback transactions: 158 pgTAP assertions across Daily, Friends, rewarded ads and parental consent. The consent suite also uses explicit exception assertions for isolation, private/public score visibility, no child ad reference, expiry and retention cleanup. Existing SQL fixtures were corrected for role privileges and smallint RPC arguments.
- New private consent tables have RLS and no client privileges; approval is not client-executable. Anonymous guest access and authenticated game RPC security-definer advisor notices are expected architecture, not blanket ignored errors.
- The policy and parent pages were checked for links, scripts, published operator contact and DOM rendering. Physical-device acceptance and signed-store upload validation remain unverified here.
