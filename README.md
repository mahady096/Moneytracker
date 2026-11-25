# Money Tracker

**Current development release:** 1.1.0 (Modern Premium dashboard update)

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
