# BloopIQ brand and deployment assets

The shared identity is the glossy cyan/blue, coral and yellow question mark from the app's splash reference. The new generated master is in `assets/branding/source/mark-master.png`. Exact exports are made from one mark so platform variants do not drift. The existing Nunito Black typeface is preserved in the path-based wordmarks.

## Native assets

| File under `assets/branding/` | Use |
| --- | --- |
| `app-icon.png` | 1024px opaque square; default app, legacy Android, and light iOS icon |
| `ios-icon-dark.png` | 1024px opaque dark appearance |
| `ios-icon-tinted.png` | 1024px opaque grayscale tinted appearance |
| `android-adaptive-foreground.png` | 1024px transparent foreground; all artwork inside a conservative safe circle |
| `android-adaptive-background.png` | Matching 1024px opaque sky background |
| `android-adaptive-monochrome.png` | White alpha silhouette for Android themed icons |
| `splash-android.png` | Transparent PNG with safe padding for the Android system splash mask |
| `splash-ios.png` | Transparent iOS launch mark |
| `mark.png` | Transparent 1024px mark for the in-app loading screen |
| `notification-monochrome.png` | Optional 96px white silhouette, ready for a future notification integration |
| `favicon.png` | 48px web icon |

`app.json` uses the new assets. The old Expo Icon Composer starter is no longer selected by `ios.icon`. The native splash background remains `#2D9CDB`. The registered application IDs, scheme, slug, build profiles, and player storage identifiers are preserved.

Opaque app/store icon files have square corners. Android/iOS apply their own masks. Rounded icon shapes in the contact sheet are previews only. Do not add rounded corners or an outside drop shadow to the store exports.

## Logo and store files

- `wordmark-light.svg`, `wordmark-on-blue.svg`, `wordmark-dark.svg`: true SVG lettering outlines, with no runtime font dependency. Matching transparent PNGs are provided.
- `logo-horizontal-*.png`: 2048x640 transparent horizontal lockups in the same variants.
- `assets/store/google-play-icon.png`: 512x512 sRGB PNG, below 1024KB.
- `assets/store/google-play-feature-graphic.png`: 1024x500 opaque RGB PNG.
- `assets/store/app-store-icon.png`: 1024x1024 opaque PNG.
- `assets/branding/asset-preview.png`: visual contact sheet, not a store screenshot.
- `assets/branding/manifest.json`: exact dimensions, file sizes and alpha metadata.

The feature graphic is a brand illustration. Actual Android/iPhone/iPad store screenshots must be captured separately from the app. It contains no store badges, device screenshots, ratings, or release claims.

## Regeneration

```sh
npm ci
npm run generate:branding
npm run check:branding
```

Sharp is a pinned development dependency. PNG resizing, alpha-silhouette extraction and layout are deterministic exports, not separate AI reinterpretations. The export pipeline removes only tiny isolated source-alpha debris; it preserves the mark and detached dot.

If changing the wordmark text or typeface, install Python `fonttools==4.61.1`, then run `python scripts/generate-brand-type.py` before regenerating. The SVGs use the project's installed `@expo-google-fonts/nunito` fonts. The font licence is retained at `assets/branding/source/Nunito-OFL.txt`. The master generation prompt and provenance are recorded next to the source artwork.

## Build and verify

Icons and native splash changes need a fresh native build; a Metro reload or OTA JavaScript update is insufficient. Test the final splash with a preview or production binary: Expo Go and development-client launch screens can differ from the standalone app.

Use the existing preview profile for an internal Android build and a signed iOS preview build where credentials/devices are configured. Preserve the current advertising environment; this branding change does not enable production advertising or change consent rules.

On real devices, verify cold launch, the transition to the in-app loading screen, launcher masks, Android themed icons, and iOS light/dark/tinted appearances. Simulator exports and config validation are not proof of native-device acceptance.

## References

- https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/
- https://docs.expo.dev/versions/latest/config/app/
- https://developer.android.com/develop/ui/compose/system/icon_design_adaptive
- https://developer.android.com/distribute/google-play/resources/icon-design-specifications
- https://support.google.com/googleplay/android-developer/answer/9866151

## Validation recorded on 2026-10-29

- `npm run check`: passed TypeScript, ESLint, 72 existing tests, and branding checks.
- `npx expo-doctor`: 20/20 checks passed after aligning React Native to the SDK-required `0.88.1` patch.
- `CI=1 npx expo prebuild --no-install --platform all`: passed; generated Android launcher/splash resources and iOS light/dark/tinted app icon sets and splash resources. Native directories remain generated and untracked.
- No signed native binary or physical-device launch was tested in this asset task.
