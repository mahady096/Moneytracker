# Money Tracker

**Release candidate:** 2.5.2 Final Optimization

Money Tracker is an English-language personal finance PWA with accounts, income, expenses, transfers, budgets, savings goals, scheduled payments, reports, exports, Smart Financial Insights, cloud backup/restore and an admin dashboard.

**Stack:** HTML, CSS, JavaScript modules, Firebase Authentication, Cloud Firestore, Cloudflare Workers static assets.

## 2.5.2 final optimization notes

- Confirmed Super Admin access requires the verified `admin.moneytracker@gmail.com` account and its matching `admins/{uid}` document in both the app and Firestore rules.
- Confirmed transaction history uses Firestore cursor pagination (up to 1,000 records per page) and can load older pages on demand; reports show a warning when additional records remain unloaded.
- Advanced the service-worker cache namespace to `mw-v15` so clients fetch this release's app files.
- Updated the app's profile version marker to `2.5.2`.
- Corrected literal escaped newline formatting in the historical changelog.
- Existing user collection names and document IDs are preserved. No bulk migration or deletion is performed.

## Firebase setup

1. Enable Email/Password and Google sign-in in Firebase Authentication.
2. Create/enable Cloud Firestore.
3. Confirm `firebase-config.js` points to the existing `moneytrack-c5787` project.
4. Publish `firestore.rules` in Firebase Console → Firestore Database → Rules **before deploying this release**. The new `blockedUsers` rules are required for admin blocking.
5. Add the deployed app hostname under Firebase Authentication → Settings → Authorized domains.
6. In Google Cloud Console, restrict the Firebase Web API key by the app's HTTP referrers and only the APIs the app uses. Firebase web config is public client configuration, not a server secret.

### Super Admin setup

1. Sign in to the app with `admin.moneytracker@gmail.com`.
2. Copy that account's UID from Firebase Console → Authentication → Users.
3. In Firestore, create `admins/{UID}` (the Document ID must be the exact UID; a field named `uid` is not a substitute).
4. Sign out and sign in again. The admin dashboard is available only to the configured email and matching UID document.

## Cloud backup behavior

- Automatic backup is **not** a server-side scheduled job. It runs when the app is opened while online, no more than once every 30 days.
- Manual Cloud Backup is available at any time.
- Restore validates the backup and merges by document ID. Matching IDs are overwritten; documents not present in the backup are retained.
- Keep an independent JSON export before restoring important data.
- Large backups can still take time and consume Firestore reads/writes. The chunking strategy reduces request-size failures; it does not make backup free.

## Deploy

Push the source to the connected GitHub branch. Cloudflare Workers should deploy the static assets from `wrangler.jsonc`. Users receive web changes the next time the hosted app is opened; the service-worker cache namespace is advanced to `mw-v15`.

## Android

- Package ID remains `com.app.moneytracker`.
- `.well-known/assetlinks.json` retains the existing signing certificate fingerprint.
- Web-only changes do not require a new APK when the Android TWA simply loads the hosted site.
- Native Android changes require a new signed build using the original keystore and an incremented versionCode. Never upload the keystore or its passwords to GitHub.

## Release verification still required

This source package has passed static JavaScript syntax and archive-integrity checks. It has **not** been live-tested against your Firebase production project or on a matrix of Android devices. Before public release, test with a disposable account:

- Sign up/sign in, Google sign-in and password reset.
- Existing account data and transaction editing.
- Admin access with the configured email and exact UID document.
- Block and unblock, including profile deletion/recreation attempt.
- Manual and automatic backup, backup retention, and restore with a large test dataset.
- Offline launch, service-worker update, exports and Android TWA navigation.

Do not deploy new Firestore rules until you have reviewed them and retained a separate backup of production data.
