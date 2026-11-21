# My Wallet — release candidate

This package preserves the existing My Wallet features and improves its mobile presentation and several reliability safeguards.

## Included improvements

- Refreshed responsive layout, improved contrast, touch targets, navigation, cards and account tiles.
- Added page description and mobile theme metadata.
- Uses the device's local calendar date for the dashboard month, default date fields, schedules and transaction dates (important for Bangladesh UTC+6).
- Validates money inputs as safe integer minor units before writing balances.
- Transaction updates now fail with a clear message if an account no longer exists or a balance would exceed the safe integer range.
- Account deletion is blocked when transaction history exists, preserving historical financial data.
- Backup restore validates document IDs and values, restores the selected currency, and clearly explains that records absent from the backup are not deleted.
- Keeps the Firebase configuration unchanged because the correct Auth domain must be copied from the project's Firebase Console, not guessed.

## Mandatory Firebase checks before publishing

1. Open `firebase-config.js` and compare **all four values** with Firebase Console → Project settings → Your apps → Web app configuration.
2. The current file has `projectId: "moneytrack-c5787"` and `authDomain: "oneytrack-c5787.firebaseapp.com"`. These do not match. Confirm the exact Auth domain in Firebase Console and correct it if required. Do not deploy until this is verified.
3. In Firebase Authentication, enable Email/Password and Google sign-in if those options are offered in the app. Add the deployed hostname to Authentication → Settings → Authorized domains.
4. Deploy `firestore.rules` to the same Firebase project used by `firebase-config.js`.
5. Test with a disposable account before importing real financial data. Verify sign-up, sign-in, sign-out, add/edit/delete account, income, expense, transfer, scheduled payments, budgets, CSV, backup and restore.
6. Test two different accounts to confirm one user's data cannot be read by another user. Test on a second device/browser to confirm sync.

## Firestore rules deployment

From this folder, after installing and signing in to Firebase CLI and selecting the correct project:

```sh
firebase use moneytrack-c5787
firebase deploy --only firestore:rules
```

If the actual project ID shown in Firebase Console is different, use that exact ID instead.

## Hosting

`firebase.json` is configured for Firebase Hosting with this folder as the public directory. If the live site is deployed using Cloudflare Workers or another host, upload the contents of this folder using that host's deployment workflow instead. Do not assume the Firebase Hosting command updates the current live URL.

## Known release limitations

- This is a release candidate, not a certified production release: Firebase credentials/domain, Authentication providers, deployed rules, real Firestore behavior and multi-device synchronization cannot be verified from this source archive alone.
- The interface remains English in this build; Bengali/English language switching has not been implemented.
- Currency is a per-wallet display code. This app does not perform foreign-exchange conversion.
- Scheduled items run when the user opens the app on or after the due date; they are not a server-side notification or background scheduler.
- Backups contain personal financial data. Store exported JSON files securely and never share them publicly.
