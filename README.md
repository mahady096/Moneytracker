# Money Tracker

**Current development release:** 2.0.0 (Cloud backup + Smart Financial Insights; release candidate, not production-certified)

A personal finance web app and installable PWA: institutions and accounts, income/expense/transfer records, scheduled payments, budgets, savings goals, lend/borrow tracking, charts and reports, backup/restore, PIN lock.

**Stack:** plain HTML, CSS and JavaScript (no build step), Firebase Authentication and Cloud Firestore, hosted on Cloudflare Workers (static assets).

## Setup
1. Create a Firebase project; enable Email/Password and Google sign-in; create a Firestore database.
2. Put your web app config in `firebase-config.js`.
3. Publish `firestore.rules` in Firebase Console > Firestore > Rules (required after every update of that file).
4. Add your domain under Authentication > Settings > Authorized domains.

## Deploy
Push to `main`; Cloudflare builds from this repository (`wrangler.jsonc`, `.assetsignore` keeps non-public files out). Users get updates on the next app open.

## Android app
Package the live URL with PWABuilder (Trusted Web Activity). Keep `.well-known/assetlinks.json` in sync with the signing key; keep the keystore safe.

## Privacy
See `privacy.html`. Users can export a backup and delete their account and data in Settings.


## Version 1.1.0 changes
- Added dashboard quick actions for income, expense and transfers.
- Added a six-month cash-flow chart to the home dashboard.
- Added persistent Auto / Light / Dark appearance selection.
- Refined the premium dashboard layout, cards, navigation and mobile spacing.
- Tightened Firestore validation so debt payments cannot exceed the debt amount and savings cannot exceed the goal target.

## Important deployment notes for 1.1.0
- Review `firestore.rules` and deploy it to the same Firebase project before relying on the new validation.
- Existing user documents are not migrated, deleted or rewritten by this release.
- Test the rules against a disposable account and existing data before production deployment.
- The app's scheduled payments still execute when the app is opened; this is not a server-side background scheduler.
- Google sign-in must be tested on the actual Android TWA build and the deployed Firebase Authorized Domains must include the app hostname.


## Version 1.2.0 — Smart Finance
- Transaction search and filters: account, type, category and date range.
- Monthly budget progress with remaining and overspent amounts.
- Savings-goal progress with completion percentage and remaining target.
- Dashboard reminders for scheduled payments that are overdue or due within the next 7 days. Reminders are in-app only; scheduled transactions are still processed when the app opens, not by a server-side background job.

This update preserves the existing Firestore collection names and document IDs. It does not run a data migration.


## Version 1.3.0 changes
- Added monthly and yearly financial report periods.
- Added period-based income, expense, net cash flow and saving-rate summaries.
- Added category-wise expense and income analysis, monthly cash-flow breakdowns for yearly reports, and budget performance.
- Added period-filtered report CSV export while retaining the all-records CSV export.
- Improved standalone HTML report export and browser Print / Save as PDF workflow.
- Clarified that account balances in reports are current snapshots, not historical period-end balances.
- Advanced the service-worker cache namespace to `mw-v6`.

### Data compatibility
This release uses existing Firestore records, accounts, budgets and goals. It does not rename collections, change document IDs, or migrate, delete or rewrite existing user data. Backup and restore retain the existing JSON format and merge-by-document-ID behavior. PDF output is generated through the browser print dialog; choose Save as PDF.


## Version 2.0.0 development notes
- Adds deterministic, on-device Smart Financial Insights using existing income, expense and budget records. This is not a generative AI chatbot and does not send financial data to an AI provider.
- Adds manual and daily-on-app-open automatic Firestore backups. Backup payloads are split into sub-1 MiB chunks under `users/{uid}/cloudBackups/{backupId}/chunks/`; the 14 newest completed backups are retained.
- Restore uses merge-by-document-ID. It overwrites matching IDs only and does not delete records absent from the selected backup. Keep a separate JSON backup before restoring.
- Automatic backup runs when the app opens with an internet connection; it is not a background scheduled job while the app is closed. It retries when connectivity returns.

### Required Firebase deployment step for 2.0.0
Publish the updated `firestore.rules` to the existing Firebase project before using Cloud Backup or Cloud Restore. In Firebase Console, open **Firestore Database → Rules**, replace the rules with this file's contents, then publish. The new `cloudBackups` and `chunks` paths are owner-only (`request.auth.uid` must match the path UID). Do not change the existing user collections or document IDs.

### AI service status
A true conversational generative AI assistant is not enabled in this build. It requires choosing an AI provider and configuring a server-side API secret plus a backend endpoint. Never put an AI API key in `app.js`, `firebase-config.js`, or any public repository file.

### Release status
This is a source development build. Before public release, test sign-in, Firestore rules, manual/automatic backup, restore on a test account, offline behavior, and Android Trusted Web Activity. A new Android APK/AAB must be built and signed with the original signing key to preserve update compatibility. The package association remains `com.app.moneytracker`; the web-only source changes do not themselves produce a new APK.


## Admin dashboard
1. Publish `firestore.rules`.
2. Sign in to the app once with the admin account and copy its User UID from Firebase Console > Authentication > Users.
3. In Firestore create collection `admins` with a document whose ID is that UID (any field, for example `role: "admin"`).
4. Open `/admin.html` and sign in. Only accounts listed in `admins` can edit the notice and slides or read messages.
