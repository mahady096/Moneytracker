# Changelog

## 1.1.0 — Development build
- Added dashboard quick actions for income, expense and transfers.
- Added a six-month cash-flow chart to the home dashboard.
- Added persistent Auto / Light / Dark appearance selection.
- Refined dashboard cards, typography, spacing and mobile navigation.
- Tightened Firestore debt and savings-goal validation.
- Capped goal contributions at the configured target to match Firestore validation.
- Advanced the service-worker cache namespace to `mw-v4`.

### Data compatibility
No Firestore collection names, document IDs or existing user records are changed by this source update. The stricter Firestore rules apply only after they are deployed. Review legacy debt and goal records before deploying the new rules.


## 1.2.0 — Smart finance update
- Added transaction filters for account, type, category and date range, alongside expanded search across both sides of transfers.
- Added a one-tap Clear filters action.
- Improved monthly budget progress with percentage used, remaining amount and overspend display.
- Improved savings-goal progress with percentage complete, remaining target and completion state.
- Added in-app payment reminders for overdue payments and payments due within the next 7 days. These are shown when the app is open; they are not background push notifications.
- Advanced the service-worker cache namespace to `mw-v5`.
- Corrected escaped newline characters in the Firestore rules source.

### Data compatibility
This update reuses the existing `records`, `budgets`, `goals` and `scheduled` collections and does not migrate, rename, delete or rewrite existing documents. Existing recurring schedules continue to follow the current app-open processing behavior.


## 1.3.0 — Advanced reports and data management
- Added monthly and yearly financial report selection.
- Added income, expense, net cash flow and saving-rate KPI summaries.
- Added category-wise income and expense analysis and yearly month-by-month cash-flow breakdown.
- Added period-filtered report CSV export; kept full transaction CSV export.
- Improved standalone HTML reports and Print / Save as PDF flow.
- Clearly labels account balances as current snapshots rather than historical balances.
- Advanced service-worker cache namespace to `mw-v6`.

### Data compatibility
No Firestore collection names, document IDs or existing user records are changed. Existing JSON backup format and restore behavior are retained.


## Version 2.0.0 (development build)
- Added on-device Smart Financial Insights based on recorded income, expenses, and budgets.
- Added owner-scoped Firestore cloud backups with chunked payloads, manual backup, latest-backup restore, daily automatic backup checks, and retention of the 14 newest completed backups.
- Cloud restore merges by document ID and never deletes existing records that are absent from the backup.
- Preserved existing collection names, document IDs, currency, app package association, and JSON backup/restore.
- Added Firestore rules for owner-only cloud backup metadata and chunks.

Note: This development build does not yet include a connected generative AI service. The Smart Financial Insights feature is deterministic and runs from the user's existing app data. A true conversational AI service requires a separately configured server-side provider key and backend endpoint.

## 2.1.0 — Admin and communication update (development build)
- Added verified-email admin access for `admin.moneytracker@gmail.com`.
- Added user listing and block/unblock controls.
- Added admin-managed sponsored ads and scrolling notices.
- Added private user-to-admin in-app support chat.
- Added Firestore rules for admin operations and support-thread privacy.
- Preserved existing finance collections, document IDs, backup and restore behavior.


## 2.1.1 — 2026-11-27
- Fixed malformed newline characters in the Admin JavaScript and Firestore rules.
- Restricted the verified administrator's user-profile updates to block metadata only.
- Added optional start/end scheduling dates for sponsored ads and notices.
- Required a verified Firebase Auth email before displaying the Admin interface.
- Bumped the service-worker cache version to ensure clients fetch the updated app files.
