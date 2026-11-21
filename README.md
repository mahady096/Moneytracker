# My Wallet (Moneytracker)

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
