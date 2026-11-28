## 2.5.4 — Dashboard summary details
- Added clickable Assets, Debts, Income and Spent cards with read-only detail lists.
- Updated service-worker cache namespace to `mw-v18`.

# Changelog

## 2.5.2 — Final optimization release candidate
- Confirmed the admin UI and Firestore `isAdmin()` rules both require the verified `admin.moneytracker@gmail.com` account and its exact `admins/{uid}` document.
- Confirmed transaction history uses cursor-based Firestore pagination with on-demand loading of older records; reports warn when more records remain unloaded.
- Advanced the PWA service-worker cache namespace from `mw-v14` to `mw-v15`.
- Updated the profile app-version marker to `2.5.2`.
- Fixed escaped newline formatting in this changelog.
- Preserved existing user data, collection names, document IDs, Android package association and signing fingerprint.

### Verification status
Static syntax, configuration and archive checks are performed for this package. Live Firebase production tests and physical Android device tests remain necessary before public release.

## 2.5.1 — Optimized release candidate
- Requires a verified `admin.moneytracker@gmail.com` account plus its UID document for Super Admin access.
- Firestore rules now enforce blocked-user access denial across private user collections; the block marker is server-enforced.
- Bounded Restore write batches by estimated request size to avoid Firestore request-size failures.

- Reduced default transaction history loading to the latest 3 months, with a 1,000-document query cap and on-demand expansion.
- Added a report warning when the 1,000-transaction cap is reached.
- Changed automatic cloud backup cadence from 14 to 30 days.
- Reduced cloud backup chunk size to 180,000 characters and write batches to 10 chunk documents to keep individual documents and requests below Firestore size limits.
- Optimized backup pruning and account cleanup to delete predictable chunk IDs without reading every chunk document first.
- Capped a user's support-message fetch at 50 items.
- Restricted Super Admin access to `admin.moneytracker@gmail.com` plus the matching `admins/{uid}` document in both the app and Firestore Rules.
- Added protected `blockedUsers/{uid}` markers so blocking persists even if a profile document is removed.
- Updated the PWA cache namespace to `mw-v14` and included all icon variants.
- Updated version metadata to 2.5.1.

### Data compatibility
Existing `users/{uid}` collections, transaction IDs and account IDs are unchanged. No user records are migrated or deleted. The new `blockedUsers` collection is only used for admin-controlled account suspension. Publish the updated `firestore.rules` before using the new blocking workflow.

### Quota notes
This build reduces repeated and oversized reads/writes, but Firebase quotas still depend on each user's number of accounts, transactions, backups and sessions. The transaction query is intentionally capped at 1,000 documents; reports that reach the cap must be narrowed to a smaller period.



## 1.1.0 — Development build\n- Added dashboard quick actions for income, expense and transfers.\n- Added a six-month cash-flow chart to the home dashboard.\n- Added persistent Auto / Light / Dark appearance selection.\n- Refined dashboard cards, typography, spacing and mobile navigation.\n- Tightened Firestore debt and savings-goal validation.\n- Capped goal contributions at the configured target to match Firestore validation.\n- Advanced the service-worker cache namespace to `mw-v4`.

### Data compatibility\nNo Firestore collection names, document IDs or existing user records are changed by this source update. The stricter Firestore rules apply only after they are deployed. Review legacy debt and goal records before deploying the new rules.

\n## 1.2.0 — Smart finance update\n- Added transaction filters for account, type, category and date range, alongside expanded search across both sides of transfers.\n- Added a one-tap Clear filters action.\n- Improved monthly budget progress with percentage used, remaining amount and overspend display.\n- Improved savings-goal progress with percentage complete, remaining target and completion state.\n- Added in-app payment reminders for overdue payments and payments due within the next 7 days. These are shown when the app is open; they are not background push notifications.\n- Advanced the service-worker cache namespace to `mw-v5`.\n- Corrected escaped newline characters in the Firestore rules source.

### Data compatibility\nThis update reuses the existing `records`, `budgets`, `goals` and `scheduled` collections and does not migrate, rename, delete or rewrite existing documents. Existing recurring schedules continue to follow the current app-open processing behavior.

\n## 1.3.0 — Advanced reports and data management\n- Added monthly and yearly financial report selection.\n- Added income, expense, net cash flow and saving-rate KPI summaries.\n- Added category-wise income and expense analysis and yearly month-by-month cash-flow breakdown.\n- Added period-filtered report CSV export; kept full transaction CSV export.\n- Improved standalone HTML reports and Print / Save as PDF flow.\n- Clearly labels account balances as current snapshots rather than historical balances.\n- Advanced service-worker cache namespace to `mw-v6`.

### Data compatibility\nNo Firestore collection names, document IDs or existing user records are changed. Existing JSON backup format and restore behavior are retained.

\n## Version 2.0.0 (development build)\n- Added on-device Smart Financial Insights based on recorded income, expenses, and budgets.\n- Added owner-scoped Firestore cloud backups with chunked payloads, manual backup, latest-backup restore, daily automatic backup checks, and retention of the 14 newest completed backups.\n- Cloud restore merges by document ID and never deletes existing records that are absent from the backup.\n- Preserved existing collection names, document IDs, currency, app package association, and JSON backup/restore.\n- Added Firestore rules for owner-only cloud backup metadata and chunks.

Note: This development build does not yet include a connected generative AI service. The Smart Financial Insights feature is deterministic and runs from the user's existing app data. A true conversational AI service requires a separately configured server-side provider key and backend endpoint.

\n## Version 2.2.0\n- Automatic cloud backup is now weekly and keeps the 4 newest backups (fewer Firestore reads, writes and storage).\n- Overdue scheduled payments are also processed when the app returns to the foreground (at most once per minute).\n- Added admin dashboard (`admin.html`): scrolling notice, swipeable highlight slides and a message inbox with replies.\n- Users can send messages to the admin from Settings and see replies. This is in-app messaging, not carrier SMS.\n- New Firestore collections: `admins` (managed manually in the console), `site` (one `config` document), `messages`. Rules updated; publish them before using these features.\n- Privacy policy updated. Service-worker cache namespace is now `mw-v8`.

\n## Version 2.3.0 (release candidate)\n- Redesigned the notice bar (pill with icon, soft edge fade, pause on touch) and highlight slides (gradient cards, tag, "Learn more", position dots).\n- Added an "Open admin dashboard" button in Settings, visible only to admins.\n- Added user management to the admin dashboard: list, search, activity stats, block/unblock, private notes. Blocked users are signed out by the app and cannot send messages (enforced in Firestore rules for messages; the sign-out is enforced by the app).\n- New collection `profiles` (email, join and last-seen dates, blocked flag, note). Created automatically when a user opens the app; deleted with the account.\n- Service-worker cache namespace is now `mw-v9`.

\n## Version 2.4.0 (Firebase usage optimization)\n- Records now load the last 6 months by default (was 12); the Reports tab loads 12 months only when opened. "Load older records" and older report months still load on demand.\n- Per-session reads cut: profile (currency), announcements (6 h), account/admin check (6 h) and the cloud-backup check are cached on the device.\n- Automatic cloud backup is now every 14 days; last-seen is written at most once per 24 hours.\n- Messages list reloads at most once a minute; admin dashboard loads users on demand and uses smaller pages (50 messages, 100 users).\n- Firestore rules evaluate the user's own access before the admin lookup so normal users never trigger an extra rule read.\n- Block checks can take up to 6 hours to apply on a device that already opened the app.\n- Service-worker cache namespace is now `mw-v10`.

\n## Version 2.5.0 (premium UI)\n- New design system: ivory and emerald light theme, deep green dark theme, champagne-gold accents, layered net-worth card, refined cards and grouped lists, gradient buttons and soft focus rings.\n- Floating glass navigation bar with icons and an active-tab indicator.\n- Subtle tab transitions (disabled when the device requests reduced motion), refined auth screen, lock screen, notice bar and highlight slides.\n- Theme colour updated; service-worker cache namespace is now `mw-v11`. No data or rules changes.

## Version 2.5.3 (contrast and premium UI fix)
- Fixed buttons (Theme, Settings, Sign out, delete and other outlined buttons) being unreadable in dark mode: dark text was forced on every button. Text colour on filled buttons now comes from a theme token (--on-ac); outlined buttons always use the normal text colour.
- Raised contrast of muted text, gold labels, slide tags, brand mark and quick-action icons in light mode.
- All six navigation tabs now fit side by side on phone width.
- Verified with an automated contrast check (light, dark, auto, forced light on dark OS, forced dark on light OS) across sign-in, every app tab and the admin page: no failures.
- Service-worker cache namespace is now mw-v17. No data, rules or app-logic changes.
