# BloopIQ milestone plan

## Shipped: casual Flags

- 48 licensed/versioned local questions with real assets and pack validation.
- Offline game engine, timing, scoring, hearts, streaks, one simulated-ad revive, records, settings, and results.

## Shipped in this milestone: Daily Flags and backend foundation

- Supabase anonymous authentication while preserving immediate offline casual play and existing local profile/records.
- Ten deterministic, version-pinned questions/options per UTC day, with protected answer keys and persisted challenge rows.
- One 30-minute ranked attempt per anonymous identity/category/day, ten-second server deadlines, no ranked pause/hints/revives, idempotent answer retries, and practice after completion.
- RLS and explicit grants, locked server-side scoring, Daily home/intro/game/results flows, UTC countdowns, Today/This Week rankings, tie rules, and database/client tests.

## Shipped: hosted Flags expansion and Daily Football

- 195-sovereign-state hosted Flags pack with versioned Storage paths, hashes, provenance, and database metadata.
- Football pack with UEFA, CAF, AFC, CONCACAF, CONMEBOL, OFC, and 11 requested league identities.
- Generic private quiz catalog, category-selected daily generation, Football UI/rankings, and protected post-answer/practice answer reveals.
- RLS enabled on legacy flag content, private challenge rounds, and the generic content catalog.
- Project-owner review recorded as approved for all 17 current Football identities; legacy `flags-v1` content and test challenges retired.
- Football enabled from the home category grid, Rankings promoted to top navigation, and a branded bounded startup preloader added for all hosted quiz assets.

## Shipped: Play with Friends

- Private nonambiguous six-character codes, 2–8 anonymous players, Flags/Football selection, copy/share invitation text, server rate limits, and full lobby readiness/host controls.
- Private roster/content snapshots, server-owned three-second countdown plus ten-second question/three-second reveal schedule, one locked answer per player/question, hidden keys until reveal, and idempotent finalization.
- RLS-protected Realtime invalidation events with authoritative fetch recovery, persisted identity/room rejoin, connection state, lobby host transfer, late-join prevention, expiry/empty-room closure, standings with shared ranks, and fresh host rematches.
- Live two-client Supabase smoke coverage for all ten questions, Realtime delivery, mid-match session reconstruction, and final standings, plus pgTAP and pure timing tests.

## Shipped: scalable Home and category navigation

- Compact Home ordered around Daily Challenge, direct Create/Join multiplayer actions, broad category discovery, and a smaller last-played Casual shortcut.
- Typed separation of browsing groups, specific backend quiz IDs, and supported game modes, preserving `flags` and `football` data contracts.
- Flags routes directly to All Flags; Sports opens Football → Leagues & Confederations, while unavailable sports and future Brands/People remain compact noninteractive previews.
- Quiz-scoped Daily selection, rankings browsing, and room creation use the shared catalogue and never fabricate unsupported content packs.

## Shipped: complete Football modes

- `Football → Leagues & Confederations` supports Casual, Daily, and With Friends using the existing `football` ID and `football-v1` hosted pack.
- Casual uses all 17 identities once per completed run, same-type-first distractors, image-gated ten-second timers, retry-safe artwork loading, one simulated-ad revive, and independent Football records.
- The authenticated Casual-pack RPC exposes only active identity metadata and asset paths; private catalog tables plus ranked/friends answer keys remain inaccessible.

## Shipped: complete Baseball and Basketball modes

- `Baseball → MLB Team Logos` and `Basketball → NBA Team Logos` each provide 30 current official team identities through immutable `baseball-mlb-v1` and `basketball-nba-v1` packs.
- Casual exhausts each 30-team pack without repeats, prioritizes recorded same-division distractors, gates timers on artwork readiness, and saves quiz-specific records/Quick Play state.
- Daily generation, Today/This Week rankings, Friends room selection/join inference, authoritative rounds, reconnect, standings, and rematches support both quiz IDs without changing Flags or Football history.
- Team IDs, names, aliases, league/conference/division metadata, official source URLs, SHA-256 hashes, and trademark-review status are recorded in the repeatable content manifest.

## Next: content operations and additional categories

- Repeat the football identity review if assets change or before the distribution context changes, and establish a repeatable asset renewal audit.
- Complete production trademark review for the 30 MLB and 30 NBA primary logos; they remain explicitly marked `trademark_review_required`.
- Add reviewed, licensed, versioned brand and sport packs through the generic content model.
- Add content-version retirement procedures so old active attempts remain playable while obsolete assets can eventually be removed.

## Next: ranking abuse controls and account recovery

- Add rate limits, CAPTCHA where appropriate, audit/telemetry fields, and abuse monitoring.
- Offer explicit anonymous-account linking/recovery and communicate identity/session limitations.
- Profile latency and consider a fairer tie-break design if network travel time materially affects competition.

## Later: production rewarded ads (explicitly deferred)

- Replace the simulator behind `RewardedAdService` with a development-build-compatible adapter and official test units.
- Add consent/region handling, privacy disclosures, load/retry states, lifecycle telemetry, and server-side verification where supported.
- Remove simulator controls from release builds and verify real reward behavior on physical Android and iOS devices.

## Release hardening

- Run accessibility, small-screen, tablet, offline, background/resume, low-power, reduced-motion, and poor-network device passes.
- Add end-to-end navigation/gameplay coverage, crash reporting, signed preview builds, store metadata, privacy/consent review, national-symbol review, and production observability.
