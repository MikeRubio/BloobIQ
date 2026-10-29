# BloopIQ rewarded advertising setup

## Current release gate

Public production advertising remains disabled until the remaining mixed-age/children's privacy implementation and the draft policy are reviewed. Publishing an AdMob consent message is only one privacy control; it does not complete children's privacy, store audience, or data-disclosure requirements.

Use an adult tester for the `ads-qa` session. The app intentionally does not globally mark BloopIQ's mixed-age audience as adults and does not set under-age or child-directed tags without an age-aware product and legal decision.

## Placement and build modes

The only placement is an optional rewarded revive in Casual play after the final heart is lost. A successful SDK reward restores one heart and can happen only once per run. Daily Challenge and Play with Friends do not import or call the ads runtime.

App identity and ad inventory are configured independently:

| Profile | Native AdMob App IDs | Rewarded inventory | QA controls |
| --- | --- | --- | --- |
| `development` / `preview` | Google sample app IDs | Google sample rewarded units | Off |
| `ads-qa` | BloopIQ Android/iOS App IDs | Google sample rewarded units | On |
| `production` | Required production environment values | Required production units | Off |

The `ads-qa` profile uses these BloopIQ App IDs so UMP can retrieve the published consent message:

- Android: `ca-app-pub-6478004441965465~2620495643`
- iOS: `ca-app-pub-6478004441965465~4153069168`

It still uses Google's official platform-specific sample rewarded units. This avoids live inventory while testing consent. Production configuration still fails closed if any production ID is missing.

## UMP consent QA

At each cold start, BloopIQ asks UMP for current consent information and presents the Google form when required. Mobile Ads initializes only when UMP returns `canRequestAds`, and rewarded loading has the same gate. Accept and decline paths are both handled according to UMP's resulting `canRequestAds` state. Settings shows **Manage ad privacy** whenever UMP reports that privacy options are required.

The `ads-qa` profile enables EEA debug geography, but Google applies debug geography only to registered UMP test devices. It also exposes a **Reset consent for testing** button in Settings. After reset, fully close and reopen BloopIQ to repeat the first-launch flow. The debug geography, device lists, and reset UI are stripped from production behavior.

### Register a physical test device

UMP and Google Mobile Ads log their own test-device identifiers. Capture and store them separately; do not assume they are interchangeable.

1. Build and install `ads-qa` once without the identifiers.
2. Launch the app. The initial UMP request logs a message containing `ConsentDebugSettings` on Android or `UMPDebugSettings.testDeviceIdentifiers` on iOS. Copy that value as the **UMP test-device identifier**.
3. Make the first rewarded ad request. Google Mobile Ads logs `setTestDeviceIds` on Android or `requestConfiguration.testDeviceIdentifiers` on iOS. Copy that value as the **Mobile Ads test-device identifier**.
4. Android logs can be filtered with:

   ```powershell
   adb logcat | Select-String 'ConsentDebugSettings|UMP|setTestDeviceIds|RequestConfiguration'
   ```

   For an iPhone, use Xcode's device console or the macOS Console app while the device is connected.
5. Save the identifiers in the EAS `preview` environment used by `ads-qa`, then rebuild:

   ```powershell
   npx eas-cli env:set --name BLOOPIQ_UMP_TEST_DEVICE_IDS --value "<UMP-ID>" --environment preview --visibility plaintext --scope project --non-interactive
   npx eas-cli env:set --name BLOOPIQ_MOBILE_ADS_TEST_DEVICE_IDS --value "<MOBILE-ADS-ID>" --environment preview --visibility plaintext --scope project --non-interactive
   ```

Multiple physical devices can be supplied as comma-separated values. The Mobile Ads identifier is not needed for Google's sample rewarded unit, but support is present for the later controlled own-unit test.

## Draft privacy policy

Settings always labels and opens the current draft policy:

<https://bloopiq-privacy.merry-coin-3817.chatgpt.site/>

The in-app label explicitly says the policy is a draft and that the consent-message publication does not complete children's privacy requirements.

## Build, install, and run

Expo Go cannot load the native advertising SDK.

Build installable QA binaries:

```powershell
npx eas-cli build --platform android --profile ads-qa
npx eas-cli device:create
npx eas-cli build --platform ios --profile ads-qa
```

The Android internal-distribution artifact is an APK. Open the EAS artifact URL/QR code on the Android phone, or download it and install it with:

```powershell
adb install -r .\BloopIQ-ads-qa.apk
```

The iOS build is ad hoc signed. Register the iPhone with `eas device:create` before the build, then open the EAS installation URL on that registered iPhone. If EAS needs new Apple credentials or a refreshed provisioning profile, run the iOS build interactively on the Apple-team account.

Because `ads-qa` is a development client, start Metro with the same public QA configuration. Add the two device-ID lines only after obtaining them:

```powershell
$env:BLOOPIQ_ADS_APP_ID_MODE='custom'
$env:BLOOPIQ_ADS_INVENTORY='test'
$env:BLOOPIQ_ADS_QA='true'
$env:BLOOPIQ_UMP_DEBUG_GEOGRAPHY='EEA'
$env:ADMOB_ANDROID_APP_ID='ca-app-pub-6478004441965465~2620495643'
$env:ADMOB_IOS_APP_ID='ca-app-pub-6478004441965465~4153069168'
$env:BLOOPIQ_UMP_TEST_DEVICE_IDS='<UMP-ID>'
$env:BLOOPIQ_MOBILE_ADS_TEST_DEVICE_IDS='<MOBILE-ADS-ID>'
npx expo start --dev-client --clear
```

Keep the phone and development computer on the same network, or add `--tunnel` to the final command.

## SSV verifier

The repository is synchronized with the deployed `admob-reward-ssv` function. The function verifies Google's exact signed query before classifying a callback. It recognizes only the narrowly identified Google-signed console verification probes, returns success without processing a reward, and accepts configured ad units in either full-ID or numeric-suffix callback form. Reward type, amount, reference, signature, transaction idempotency, and the configured production allowlist remain enforced.

Google's official sample rewarded units prove the client presentation and one-heart callback behavior. They do **not** prove reconciliation through BloopIQ's production ad units and SSV callback. That requires a separate controlled build using BloopIQ's own rewarded unit IDs on devices registered as Mobile Ads test devices. Do not click own-unit inventory until the device displays Google's test-mode treatment.

The production SSV callback is:

`https://gtuduildbndrxwpzgvte.supabase.co/functions/v1/admob-reward-ssv`

## Phone checklist

- The published consent form appears on a registered EEA-debug device.
- Accept and decline paths both complete without blocking Casual play.
- **Manage ad privacy** reopens the Google privacy-options form.
- The platform-appropriate Google sample rewarded ad presents with test treatment.
- Earning the reward grants exactly one heart.
- Dismissing before earning grants no heart.
- A second death finishes the run normally.
- Daily and Friends never display or preload the rewarded placement.
