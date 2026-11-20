# Reading Accountability

Offline-first Expo SDK 58 / React Native app using TypeScript and Expo Router. Phase 2 adds a persistent book library and per-book daily page goals. Authentication, cloud services, reading-session logging, groups, and rankings remain deferred.

## Run

```sh
npm ci
npx expo start
```

SQLite, ImagePicker, and FileSystem were installed using `expo install`. For an existing custom development client, rebuild it to include the new native modules. Follow the project's development-build workflow; no native folders are checked in. A compatible Expo Go installation can also provide these bundled Expo modules.

## Structure and behavior

- `src/app/(tabs)`: the original five bottom tabs; Home and Library use real local data.
- `src/app/books`: Add, Details, and Edit screens in a root stack outside the tab bar.
- `src/features/books`: forms, validation, estimated reading days, shared book cards, and library state.
- `src/storage`: SQLite connection, versioned migrations, bound repository queries, and cover storage.
- `src/constants/design.ts` and `src/components/reading-ui.tsx`: shared green-and-white design system.

The library starts empty. Add a title, positive integer page count and daily target, optional author and cover, current page (default zero), and reading status. Add supports Currently Reading and Want to Read. Edit additionally supports Completed when the current page equals total pages. Changing status never automatically adds pages. Current-page editing corrects an existing position; it does not create reading activity. Daily goals never increment progress.

Estimated reading days = `ceil((totalPages - currentPage) / dailyTarget)`. Home sums targets for Currently Reading books and displays their stored progress. Daily session totals and streaks are not fabricated; logging remains a Phase 3 preview.

Books and goals are stored in `reading-accountability.db`. `PRAGMA user_version` controls transactional migrations. Book metadata and target edits are saved in one SQL statement. Native covers are copied into the app documents directory before the database write; the database stores a relative filename so sandbox path changes do not break covers. Replaced covers are removed after the successful write. Failed writes attempt to remove the new copy. Abrupt process termination during copying can leave an unused file, but does not replace the saved book. Uninstalling the app or clearing its data removes the local library.

On web, SQLite uses its WASM implementation and covers are embedded in the SQLite row as data URLs (10 MB image limit). Metro is configured for WASM and cross-origin isolation headers. A deployed web server also needs `Cross-Origin-Embedder-Policy: credentialless` and `Cross-Origin-Opener-Policy: same-origin`, HTTPS, and a browser supporting SQLite's storage APIs. Browser storage can be evicted; native Android/iOS are the primary targets. There is no offline web service worker.

## Automated checks

```sh
npm run typecheck
npm run lint
npm test
npx expo export --platform android --platform web
```

Tests require Node 22.18+ with built-in TypeScript stripping and `node:sqlite` (Node 24+ recommended). They exercise the actual validation, goal calculations, migration, and repository code through a Node SQLite adapter: valid/invalid input, page bounds, completion consistency, SQL parameter binding, goal edits without adding progress, migration idempotence/rollback, future-version rejection, and persistence after closing/reopening a real database file. They do not execute the Expo native bridge or a device photo picker.

## Airplane-mode acceptance test (Android)

1. Load required development assets first. For a fully disconnected cold-launch test, install a release build containing the JS bundle and assets. Expo Go/development reloads may still require Metro; use `npx expo start --offline --lan` with local Wi-Fi if testing through Metro.
2. Enable airplane mode. With a bundled release build, keep both mobile data and Wi-Fi off. Open Library; a new install should show empty shelves.
3. Add a local book: 101 total pages, current page 0, target 20, Currently Reading. Choose a photo already downloaded to the device. Save; confirm the cover, progress 0/101, and 6 estimated reading days.
4. Open Home and the book details. Confirm the 20-page plan and zero book progress; creating a goal must not add pages.
5. Edit the target to 10; confirm 11 estimated days and unchanged progress. Correct the current page to 21; confirm 8 days. Move the book to Want to Read and verify its shelf and removal from Home's active daily plan.
6. Test blank title, zero/negative/decimal page counts or targets, and a current page above total. Confirm field errors and no new book. Try Completed before the final page; confirm it requires correction rather than silently changing progress. Set current page to 101 and Completed; confirm the Completed shelf and zero days left.
7. Replace/remove the cover, cancel photo selection, and cancel editing; confirm canceled changes do not alter the saved book. Test a denied picker/storage failure if possible, retry, and confirm the form remains available.
8. Force-stop and reopen in airplane mode. Confirm books, covers, status, and goals remain. Check Android back navigation, all five tabs, larger system text, the keyboard, and a small display.

Device photo selection, process restart, and airplane-mode tests must be performed on a device; passing host tests or bundle exports does not imply those have run.

### Phase 4 work in progress

Account sign-in requires a Supabase project: copy `.env.example` to `.env` and set the public project URL and publishable key. Never place a service-role or secret key in the app. Email confirmation and password recovery depend on the Supabase Auth project settings. Recovery links need a configured destination that lets the user set a new password; an in-app recovery flow has not been implemented.

The cloud schema in `supabase/migrations/20261120000100_reading_backup.sql` is an **unverified preparation**, not a deployed or production-ready sync backend. Do not deploy it as a complete backup solution: conditional writes, a commit-safe incremental change feed, conflict review, account isolation on the device, restore, and the synchronization worker remain to be implemented and tested. In particular, sequence values alone cannot serve as a reliable incremental cursor when transactions commit out of order.

SQLite remains the only active store for reading data. The local outbox assigns UUIDs and queues changes in the same transaction; no data is uploaded, and signing in does not associate or back up the local library. Existing local libraries remain available without signing in. Cloud RLS and end-to-end authentication require a separate Supabase test project for integration testing.
