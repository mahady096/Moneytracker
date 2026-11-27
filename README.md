# Money Tracker

**Current development release:** 2.1.0 (Admin tools, sponsored content, notices and support chat; release candidate, not production-certified)

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

## Admin account setup for 2.1.1
1. Ensure `admin.moneytracker@gmail.com` is controlled by the app owner.
2. Create that account in Firebase Authentication (or sign in if it already exists).
3. Verify the email address using the Firebase verification email. The Admin tab is only enabled for this exact verified email.
4. Deploy the updated `firestore.rules` to project `moneytrack-c5787` before using Admin, ads, notices or support chat.
5. Sign in again after verifying the email. Do not grant administrator access by editing client-side JavaScript or by changing a profile document.

The Admin tab can list user profile documents and block/unblock users. A blocked user's access to user-owned Firestore collections is denied by the rules. The app's user profile document stores only basic profile fields and an optional blocked flag; it does not expose another user's financial records to the admin UI.

## Version 2.1.1 — Admin and communication features
- Added a verified-email administrator role for `admin.moneytracker@gmail.com`.
- Added user listing and account block/unblock controls.
- Added admin-managed sponsored advertisements and scrolling notices, including optional start/end dates.
- Added private user-to-admin support conversations.
- Hardened Firestore rules for verified-email admin management, owner/admin-scoped support messages, and server-enforced blocked-account restrictions.
- Existing financial collections and document IDs remain unchanged.
- The admin account must first exist in Firebase Authentication and have a verified email. Deploy the updated Firestore rules before using these features.
- This source package has passed JavaScript syntax and archive-integrity checks only. It still requires deployment and live Firebase testing; do not treat static checks as production certification.


### 2.1.1 security and release notes
- The sole administrator is the Firebase Authentication account `admin.moneytracker@gmail.com` with a verified email. Firestore Security Rules verify the signed Firebase token; the email check in the UI is only for showing the Admin tab.
- User profile documents contain only basic account settings and block status. Admin updates are restricted to block metadata and cannot change a user's financial records.
- A blocked user's reads and writes to their user-owned data and support thread are denied by Firestore rules.
- Ads and notices support optional start/end dates (inclusive, based on the user's local calendar date). Leave both dates blank for immediate, ongoing publication.
- Before deployment, publish `firestore.rules` to the existing `moneytrack-c5787` Firebase project. Do not delete or recreate Firestore collections.
- This is a web-source update. It does not include a newly signed Android APK/AAB. Keep the existing package ID and original signing key for any future native release.
