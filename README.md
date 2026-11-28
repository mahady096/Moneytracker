# Money Tracker

**Release candidate:** 2.5.1 Optimized

Money Tracker is an English-language personal finance PWA with accounts, income, expenses, transfers, budgets, savings goals, scheduled payments, reports, exports, Smart Financial Insights, cloud backup/restore and an admin dashboard.

**Stack:** HTML, CSS, JavaScript modules, Firebase Authentication, Cloud Firestore, Cloudflare Workers static assets.

## 2.5.1 optimization notes

- Recent transaction listener starts with the latest 3 months and is capped at 1,000 documents. The user can load older months when needed.
- Yearly reports expand the loaded date range, subject to the same 1,000-document safety cap. If a report reaches that cap, narrow the period before relying on its totals.
- Automatic cloud backup checks every 30 days (when the app is opened online); manual cloud backup remains available.
- Backup JSON is split into 180,000-character chunks and written in batches of 10 chunk documents to stay below Firestore document/request limits, including non-ASCII text.
- Backup retention keeps the latest 4 completed backups. Pruning deletes known chunk IDs in batches instead of reading every chunk first.\n- Restore writes use bounded batches (maximum 200 documents / approximately 6 MiB per request) to reduce Firestore request-size failures.
- The user's support-message history is capped at 50 items per fetch.
- Only `admin.moneytracker@gmail.com` with its matching `admins/{uid}` document is accepted by the app and Firestore admin rules.
- Admin blocking writes a protected `blockedUsers/{uid}` marker. Rules also honor legacy `profiles/{uid}.blocked` values, and a blocked user cannot delete their own profile to bypass the restriction.
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

Push the source to the connected GitHub branch. Cloudflare Workers should deploy the static assets from `wrangler.jsonc`. Users receive web changes the next time the hosted app is opened; the service-worker cache namespace is advanced to `mw-v13`.

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
