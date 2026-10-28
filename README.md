# BloopIQ

BloopIQ is a guest-first mobile quiz game built with Expo, React Native, TypeScript, Expo Router, Zustand, Reanimated, and Supabase. It includes offline Casual Flags, server-authoritative Daily play, and live private friend rooms.

## Playable now

- Casual Flags: 48 public-domain flags, four choices, three hearts, ten-second deadlines, speed bonuses, streaks, one optional simulated-ad revive, and local records.
- Daily Flags: ten deterministic questions selected from a hosted 195-sovereign-state pack for everyone each UTC day, one ranked attempt per anonymous identity, no hints or revives, server-controlled scoring, and resumable 30-minute attempts.
- Daily Football: a hosted pack of all six continental confederations plus 11 requested leagues, using the same ranked rules and an independent daily attempt/ranking.
- Startup: a branded BloopIQ preload gate warms all 212 hosted quiz images plus bundled flags/sounds, with a bounded timeout so offline Casual play is never trapped behind the network.
- Practice: after completing the ranked attempt, the daily set can be replayed without changing the ranked score.
- Rankings: real completed attempts for Today and This Week. Higher score ranks first, then lower server-measured active answering time; exact ties share a rank.
- Working sound, haptics, and reduced-motion settings.
- Play with Friends: private six-character rooms for 2–8 anonymous players, Flags or Football, ready checks, live server-timed questions/reveals, reconnect recovery, final standings, and host rematches.

Additional sports/brand packs, production rewarded ads, and account linking remain future milestones. See [MILESTONES.md](./MILESTONES.md).

## Requirements

- Node.js 20.19+ (validated here with Node 26.7.0)
- npm
- Docker Desktop for the local Supabase stack and database tests
- Expo-compatible Android/iOS tooling for native local builds, or an Expo account for EAS Build

## Install and run

```bash
npm install
copy .env.example .env
npm start
```

Without Supabase environment values, Casual Flags remains playable and Daily screens show an honest setup state. Direct Expo commands are also available:

```bash
npm run android
npm run ios
npm run web
```

## Local Supabase

The committed migrations create the versioned question catalog, daily challenge/attempt/answer schema, RLS policies (including all private content/round tables), authenticated RPCs, deterministic UTC challenge generation, public read-only quiz asset bucket, and leaderboard queries.

```bash
# Requires Docker Desktop
npm run db:start
npm run db:reset
npm run db:test

# Print the local URL and client key
npx supabase status
```

Put the local API URL and publishable client key in `.env`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-local-publishable-or-anon-client-key
```

For a hosted project, enable anonymous sign-ins in Supabase Auth, link the intended project explicitly, and review before applying `npx supabase db push`. Never place a service-role or secret key in an `EXPO_PUBLIC_` variable. Incoming SSL enforcement should remain enabled.

Regenerate the immutable hosted content manifest and upload staging files with:

```bash
node scripts/prepare-quiz-assets.mjs
npx supabase storage cp -r .quiz-assets/flags-195-v1 ss:///quiz-assets/flags-195-v1 --linked
npx supabase storage cp -r .quiz-assets/football-v1 ss:///quiz-assets/football-v1 --linked
```

`.quiz-assets/` is ignored staging output. Supabase stores the playable metadata and answer choices; Storage serves the image bytes from stable versioned paths.

## Daily rules and interruption behavior

- The server day resets at 00:00 UTC; weekly rankings run Monday through Sunday UTC.
- Starting creates one ranked attempt for that anonymous user/category/day. Reopening resumes it, including across a UTC reset, until it completes or reaches its 30-minute expiry.
- Each question has ten server-measured seconds. Backgrounding, closing, or losing connectivity does not pause ranked time. On resume, an elapsed current question becomes a zero-point timeout and the next question starts from the server response.
- A request UUID makes answer retries idempotent. Clients cannot insert/update attempts or answers directly, and score, correctness, time, completion, and rank are computed by database functions.
- Device time is display-only. Network travel time is included in server-measured duration, so the tie-break is consistent but is not a perfect measurement of human reaction time.

Anonymous auth is convenient, not strong identity. A session may be unrecoverable after local data loss, reinstall, or storage clearing, and a person can create multiple anonymous identities. Add CAPTCHA/rate limiting, abuse monitoring, and an account-linking path before treating public competition as high-trust.

Correct choice IDs and validation stay server-side, but the current app also ships the casual flag names/assets offline. A determined player can inspect that pack or recognize a flag, so this architecture raises the cost of score tampering; it does not make a quiz cheat-proof.

## Play with Friends rules

- Create a room from Home → Play with Friends, choose Flags or Football, then share the six-character code. Codes omit ambiguous characters; the app intentionally shares text instructions rather than an unverified deep link.
- A match requires 2–8 active members and every member must finish asset preparation and mark ready. New identities cannot join after the host starts, while an existing room identity can reconnect from the persisted anonymous session.
- The database snapshots the roster, content version, ten questions, options, and answer keys at start. A shared schedule provides a three-second countdown, ten-second answer windows, three-second reveals, and the final transition. Closing or backgrounding a phone never pauses it.
- During an answer window, the client receives only the current asset and opaque options. The server validates membership, match/question identity, choice, deadline, and one answer per player; only an answer count and that player's locked choice are shown early. The correct choice appears during reveal.
- Exact score and active-duration ties share rank. A host rematch returns recently connected members to a fresh lobby and creates a new match identity/questions when started.
- Lobby rooms expire after 30 minutes; result rooms receive a 15-minute recovery window. Empty rooms close immediately. Expiry is reconciled whenever a room RPC is called, so cleanup does not depend on a host phone or a background timer.
- Room creation is limited to five per identity per ten minutes; joins are limited to 20 per identity per five minutes. Anonymous auth is still not high-trust identity—add CAPTCHA and abuse monitoring before a public competitive launch.

### Two-phone Expo test

1. Put the linked project URL and publishable key in `.env`, enable anonymous sign-in, then run `npx expo start --tunnel` (or LAN when both phones share a network).
2. Open the QR code in Expo Go on two phones. On phone A create a room and share/copy the code; on phone B join it.
3. Wait for each lobby's asset preparation to finish, mark both ready, and start from phone A. Verify both phones show the same countdown/question/reveal changes.
4. After answering, close Expo Go on phone B, reopen the project, enter Play with Friends, and verify it resumes the same player/room without a duplicate roster row.
5. Complete the ten questions, compare standings, and use Play again from the host. A physical-device pass remains required for final native acceptance; automated exports and the database smoke test do not prove device UX.

## Development builds

`expo-dev-client` and `eas.json` are included so production native integrations can be added behind the existing service boundaries.

```bash
npm run android:dev
npm run ios:dev
npm run dev-client
npx eas-cli@latest build --profile development --platform android
```

After adding or changing a native dependency, rebuild the development client.

## Validation

```bash
npm run check
npx expo-doctor

# Requires the local Supabase stack
npm run db:test
```

The TypeScript suite covers casual scoring/lifecycle rules, content/assets, UTC boundaries, ranked deadline behavior, interruption outcomes, tie ranking, profile migration, and static migration security invariants. The pgTAP suite covers RLS/privileges, deterministic challenge shape, hidden answer keys, ownership, idempotent submissions, uniqueness, and daily/weekly ranking.

For a hosted end-to-end friend-room check (creates temporary anonymous test players), run `node scripts/smoke-friends.mjs`. It uses the real 133-second match schedule, validates Realtime delivery and reconnect, and prints final standings. Remove the temporary test identities afterward.

## Architecture

- `src/app/` - Expo Router screens and navigation composition.
- `src/backend/` - configuration-gated Supabase client, anonymous-session lifecycle, typed RPC boundary, and local-profile projection.
- `src/daily/` - pure UTC, interruption, and ranking rules used by tests and UI.
- `src/friends/` - pure projection of the server-owned friend-match schedule.
- `src/content/` - typed local quiz content and explicit asset registry.
- `src/services/startup-preload.ts` - bounded local/hosted asset warming used by the branded launch gate.
- `src/game/` - pure casual selection, scoring, timing, and run-lifecycle rules.
- `src/store/` - transient game/daily state plus persisted guest/settings/records state.
- `supabase/migrations/` - versioned schema, content, RLS, and authoritative RPCs.
- `supabase/tests/database/` - pgTAP integration tests.

The visible product name is BloopIQ. The Expo slug, URL scheme, Android/iOS application IDs, and `guessr-player-v1` storage key intentionally retain their original values to preserve registered app identity, deep links, and existing local player data.

## Assets and licences

- Flags: PNG renders from [`hampusborgos/country-flags`](https://github.com/hampusborgos/country-flags), package version 1.2.10 at pinned commit `c09927e63705529bbf59ca6684cd9b23225dddad`. The package declares `PD`; its README states the artwork is public domain and sourced primarily from Wikimedia Commons. Files keep their native aspect ratios and render with `contain`.
- Football identities: 17 sourced confederation/league marks with their source page, source asset URL, checksum, and attribution status recorded in `supabase/content/quiz-content.json`. The project owner reviewed and approved the current pack for pre-production quiz use on 2026-10-28. Repeat the release review if the pack or production use changes.
- Font: Nunito through `@expo-google-fonts/nunito`, SIL Open Font License 1.1.
- Feedback sounds: original short tones generated by `scripts/generate-sounds.mjs`; regenerate with `npm run generate:sounds`.

National symbols can be subject to non-copyright usage rules in some jurisdictions; review those rules before commercial release. The 195-country scope is the 193 UN member states plus Palestine and Vatican City, excluding dependent territories.
