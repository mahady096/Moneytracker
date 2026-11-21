# My Wallet — Improved build

## Changes in this build
- Scheduled payments now use a deterministic record ID and a Firestore transaction. This prevents two devices from applying the same due installment twice.
- Monthly/quarterly/yearly schedule advancement clamps dates to the last valid day of the target month (for example, Jan 31 → Feb 28/29).
- Restore validates the backup structure and key amounts before writing, then commits in Firestore batches.
- Removed the hard 1,000-record query cap so reports and the transaction list do not silently omit older records.
- Firestore rules now validate basic types and positive amounts for records, budgets, and scheduled payments.

## Required Firebase setup before deployment
1. Open `firebase-config.js` and verify every value against Firebase Console → Project settings → Your apps.
2. **Important:** this archive has `projectId: "moneytrack-c5787"` but `authDomain: "oneytrack-c5787.firebaseapp.com"`. Verify the authDomain in Firebase Console and correct it if it is a typo. I have intentionally not guessed the correct project setting.
3. In Firebase Authentication, enable Email/Password and Google sign-in if you want those buttons to work. Add your deployed domain to Authorized domains.
4. Deploy the included Firestore rules: `firebase deploy --only firestore:rules`.
5. Deploy hosting from this folder with `firebase deploy --only hosting`.

## Notes
- The Firebase web config (including the API key) is client-side configuration, not a server secret. Protect data with Firestore Security Rules and Firebase Console restrictions.
- Test with a disposable Firebase account and sample data before using real financial records.
- The app still uses browser-local date/time and the existing UI. Live Firebase deployment, authentication, security-rule emulator tests, and multi-device testing have not been run here.
