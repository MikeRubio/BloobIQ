# BloopIQ engineering guide

BloopIQ is an Expo SDK 58 / React Native mobile quiz game. Keep casual packs guest-first and offline-capable. Ranked Daily state must remain honest, server-authoritative, and clearly unavailable when backend configuration or connectivity is missing.

## Required checks

Before finishing a change, run:

```bash
npm run check
npx expo-doctor
```

When Docker is available, also run `npm run db:reset` and `npm run db:test`. Install Expo dependencies with `npx expo install <package>`. Native projects use Continuous Native Generation; configure native behavior in `app.json` or config plugins rather than hand-editing generated native folders.

## Architecture boundaries

- Route files live only in `src/app/`. Keep components, stores, services, backend adapters, and pure rules outside it.
- `src/game/` and `src/daily/` stay pure and platform-independent. No React, Router, animation, storage, or SDK imports.
- `src/content/` owns typed offline packs and asset registries. Every question needs stable identity, category, name, asset key, difficulty, distractors, and provenance.
- Hosted Daily packs live in `private.quiz_content` with versioned files in the public-read `quiz-assets` Storage bucket. Keep answer keys and catalog writes private; clients receive only a persisted asset path and opaque choices until submission.
- `src/store/profile-store.ts` is the persisted local profile/settings/records boundary. Do not rename its legacy storage key without a migration.
- `src/backend/` owns anonymous auth and RPC calls. Never expose secret/service-role credentials to the app.
- Ranked score fields are mutated only in locked, authenticated database functions. Keep client table privileges and RLS regression tests strict.
- `src/services/rewarded-ad.ts` remains the replaceable casual-ad boundary. Ranked Daily never uses revives or ads.

## Game invariants

- Casual timers pause outside the foreground and rebuild from stored remaining time. Daily ranked timers do not pause and are projected from server timestamps.
- Only an answering state accepts a choice. First selection or timeout transitions immediately to feedback.
- A run never repeats a question. A round has exactly one correct answer and three unique valid distractors.
- Daily uses ten questions, one ranked attempt per anonymous identity/category/UTC day, a 30-minute expiry, idempotent request IDs, and server-authoritative points/time.
- Daily answer keys are never returned to the ranked client. Practice becomes available only after ranked completion.
- Daily rankings contain completed real attempts only: score descending, active duration ascending, exact ties sharing rank.
- A casual rewarded callback grants at most one revive, and the engine independently permits at most one revive per run. Cancellation/failure never consumes it.
- Future/dummy features must say "Coming soon". Never fabricate ranking rows, ad delivery, backend state, or device acceptance.
- Startup asset warming must remain bounded and failure-tolerant; connectivity loss must never block offline Casual play indefinitely.

## UI conventions

- Reuse `src/theme/tokens.ts`; preserve safe areas and 44pt+ touch targets.
- Render flags with `resizeMode="contain"`; never crop, stylize, substitute emoji, or generate flag artwork.
- Keep flag question art on the shared `flagStage` contrast mat so white flag fields retain a visible boundary.
- Combine system reduced motion with the in-app override for nonessential motion.
- Settings must change runtime behavior, not decorative switches.
- Answer feedback must remain understandable without relying on color alone.

## Compatibility identifiers

The visible brand is BloopIQ, but `guessr` remains the Expo slug and URL scheme, `com.guessr.game` remains the native application ID, and `guessr-player-v1` remains the AsyncStorage key. Treat changes to these as explicit migrations, not cosmetic renames.
