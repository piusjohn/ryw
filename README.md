# Reading Accountability

Phase 1 of a mobile-first Expo SDK 58 / React Native app, using TypeScript and Expo Router.

## Run

```sh
npm ci
npx expo start
```

Open in a compatible Expo Go installation or Android/iOS development environment. Use `npx expo start --offline --lan` to develop without internet once dependencies and required development assets are loaded. Keep the device and Metro server on the same local network.

## Phase 1

- Five bottom tabs: Home, Library, Groups, Leaderboard, Profile.
- Home dashboard with sample statistics, daily goal, current book progress, and weekly activity.
- Log Reading opens an explicitly labeled preview; it does not record or save sessions.
- Remaining tabs are placeholders for future phases.
- Shared design tokens in `src/constants/design.ts`, reusable UI in `src/components/reading-ui.tsx`, and typed mock data in `src/data/dashboard.ts`.
- System fonts, native-view illustrations, and bundled mock data; no remote images, font downloads, API requests, authentication, or cloud services.
- SQLite and persistent reading logs are deferred until a phase that needs data entry and storage.

## Verify

```sh
npm run typecheck
npm run lint
npx expo export --platform android
```

On a device, open all five tabs, follow My library and the profile avatar, and open/dismiss Log Reading (including Android back). Try a small display and larger system text; scroll to the bottom and verify content stays clear of navigation.

For an offline smoke test, load the app and its assets, disconnect internet while keeping the local Metro connection available, then navigate through every tab and open the preview. The UI requires no network services. Expo Go/development reloads may still need Metro; a fully disconnected cold-launch test requires an installed release build with its JavaScript and assets bundled. Build that in a later deployment step, then force-stop and reopen in airplane mode. Web offline reloads are not supported by a service worker in Phase 1.

No device runtime or airplane-mode test is implied by a successful bundle export.
