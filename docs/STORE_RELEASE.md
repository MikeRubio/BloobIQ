# BloopIQ store release readiness

Verified against `7184f5b` and the follow-up flags-only release changes on 1 November 2026.

## Product decisions

The first store release contains country flags only. Casual, Daily, rankings and private Friends rooms remain supported for Flags. Football, baseball, basketball, brands, history and celebrities stay available in full-catalogue development builds while their production artwork rights are unresolved. No rights-status records have been relabelled as approved.

The intended audience remains **all ages with online play**. The publisher explicitly chose to keep that scope, rather than restricting younger users to offline play. The appropriate parental-consent and children's online data-handling flow has not been implemented and verified. Public release therefore remains blocked. Disabling ads, using generated nicknames, publishing a policy, or adding a checkbox does not by itself resolve that blocker.

`config/store-release.json` records this pending state. Do not change `allAgesOnlinePrivacyReady` merely to obtain a build: it requires a real implemented and verified flow and an assessment of the complete child-data lifecycle. No parental verification provider is currently integrated. The release work must decide the lawful child-data/consent model, parent and child relationship verification, age handling before data collection, withdrawal and deletion, retention, and provider processing. Avoid storing identity documents or full birth dates in this game.

## Release catalogue enforcement

- Both `testflight` and `production` explicitly set `EXPO_PUBLIC_RELEASE_CATALOG=flags-only`. Android internal testing inherits that setting.
- Home, quiz navigation, mode selectors, rankings, records and saved Quick Play only expose allowed quizzes.
- Non-flag deep links fall back to Flags. Backend adapters reject non-flag requests, and an unsupported room joined by code is left before exposing its content.
- Startup and Friends warming only fetch allowed flag assets.
- The production content-rights check evaluates the effective catalogue: 195 flag entries pass; 601 other entries remain excluded. Setting the full catalogue still fails the rights check.
- The public-release gate separately blocks the unfinished all-ages online privacy flow. Test success does not bypass that gate.

## Live backend verification

The account-deletion migration and `delete-account` function are deployed. The committed migration filename was aligned with the deployed timestamp `20261101144656`; normalized SQL hashes matched exactly, so no duplicate migration was applied.

A temporary guest was created for verification, synced, and used to create an owned Flags room. The live deletion function rejected missing confirmation with HTTP 400, accepted explicit confirmation with HTTP 200, and deleted the account and owned room. The former access token was rejected by a protected RPC and its refresh token was rejected. Database checks confirmed no remaining test auth user, session, profile or hosted room. No existing player data was changed by that test.

The deletion function authenticates the caller server-side and performs a hard Auth deletion after application cleanup. Moderation tables and RPC are deployed, and canonical profile and Friends name constraints both allow 3–32 and 1–32 characters respectively.

## Advertising and permissions

Production ads default off in `eas.json` and the runtime stops before UMP/SDK initialization when disabled. When deliberately enabled after review, the adapter configures child-directed/under-age treatment, G-rated ad content and non-personalized requests. These settings are not a declaration of children's privacy compliance.

Native generation was checked for the absence of iOS microphone purpose text and background audio. Android recording, advertising-ID, external-storage and overlay permissions are explicitly removed. Final Android merged manifests and iOS archives still need verification in signed builds.

## Adult internal QA

Internal adult QA can continue while public release is blocked. Do not invite children or publish a public beta link as a substitute for completing the online children's flow.

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

The first passes for Flags. The second currently fails for the unfinished all-ages online privacy flow. Once that work is actually completed and verified, create production candidates using `npm run build:ios:production` and `npm run build:android:production`; test the exact signed candidates before submission.

## Public URLs

- Privacy and current release status: https://bloopiq-privacy.merry-coin-3817.chatgpt.site/
- Support: https://bloopiq-privacy.merry-coin-3817.chatgpt.site/support.html
- Outside-the-app deletion instructions/request: https://bloopiq-privacy.merry-coin-3817.chatgpt.site/delete-account.html

The completed policy, effective 1 November 2026, describes implemented processing, deletion/moderation controls, disabled production ads, retention, service providers and user rights. It contains no draft wording and accurately states that current builds are for internal adult testing, while the intended all-ages public online release remains blocked on the missing consent/data-handling flow. Finishing the policy does not implement or approve that flow. The public deletion page provides the in-app steps and an email request mechanism; a nickname or email address alone does not establish ownership of an anonymous account. Do not delete an existing account solely because someone emails its public nickname or ID.

## Store account and signed-build checks still required

App Store Connect: confirm bundle ID `com.guessr.game`, agreements, age-rating questionnaire, accurate privacy labels, current public policy/support URLs, content-rights declarations, real iPhone/iPad screenshots, review contacts/notes, and EU trader status. Inspect the signed archive and privacy manifest aggregation; complete Apple upload validation. Use the SDK 58 EAS image configured in the profile and verify the actual Xcode/iOS SDK versions in the build log.

Google Play: confirm package `com.guessr.game`, app signing, unique version code, Android target SDK requirement, final merged permissions, native-library 16 KB page-size compatibility, Data safety, account-deletion URL, ads declaration, target audience/Families requirements where applicable, IARC rating, store assets/support details and any account-specific production-testing requirements. Answer disclosures for actual bundled SDK behavior and the all-ages online data model, not solely the lack of a login form.

Both platforms: verify cold launch, flags imagery, Daily start/submission/rankings, two-device room creation/joining/reconnects, Report & Block, account deletion/cancellation/failure, offline error/retry, background/foreground timing, sound restoration, accessibility text sizes and iPad layout. Signed native builds, store forms, legal audience review and physical-device acceptance are not established by Metro exports or unit tests.

## Validation

`npm run check`: TypeScript, ESLint, 116 tests, and branding checks passed. Expo Doctor: 20/20. iOS and Android native project generation passed. Live account deletion and token invalidation passed as described above. Record subsequent archive/device results separately; no store approval is claimed.
