# Money Tracker — release candidate

This package preserves the existing Money Tracker features and improves its mobile presentation and several reliability safeguards.

## Included improvements

- Refreshed responsive layout, improved contrast, touch targets, navigation, cards and account tiles.
- Added page description and mobile theme metadata.
- Uses the device's local calendar date for the dashboard month, default date fields, schedules and transaction dates (important for Bangladesh UTC+6).
- Validates money inputs as safe integer minor units before writing balances.
- Transaction updates now fail with a clear message if an account no longer exists or a balance would exceed the safe integer range.
- Account deletion is blocked when transaction history exists, preserving historical financial data.
- Backup restore validates document IDs and values, restores the selected currency, and clearly explains that records absent from the backup are not deleted.
- Updated the Firebase web configuration using the exact values supplied from Firebase Console, including the matching `authDomain`, `storageBucket`, `messagingSenderId`, and `measurementId`.

## Mandatory Firebase checks before publishing

1. `firebase-config.js` has been filled with the configuration supplied from Firebase Console. Recheck it against Project settings → Your apps before production release.
2. In Firebase Authentication, enable Email/Password and Google sign-in if those options are offered in the app. Add the deployed hostname to Authentication → Settings → Authorized domains.
3. Deploy `firestore.rules` to the same Firebase project used by `firebase-config.js`.
4. Test with a disposable account before importing real financial data. Verify sign-up, sign-in, sign-out, add/edit/delete account, income, expense, transfer, scheduled payments, budgets, CSV, backup and restore.
5. Test two different accounts to confirm one user's data cannot be read by another user. Test on a second device/browser to confirm sync.

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

- This is a release candidate, not a certified production release: Authentication providers, deployed rules, real Firestore behavior and multi-device synchronization cannot be verified from this source archive alone.
- The interface remains English in this build; Bengali/English language switching has not been implemented.
- Currency is a per-wallet display code. This app does not perform foreign-exchange conversion.
- Scheduled items run when the user opens the app on or after the due date; they are not a server-side notification or background scheduler.
- Backups contain personal financial data. Store exported JSON files securely and never share them publicly.


## Version 1.1.0 development changes
- Home dashboard now includes direct Add income, Add expense and Transfer actions.
- Home dashboard now displays the existing six-month income-versus-expense chart.
- Added a persistent Auto / Light / Dark theme selector; Auto follows the device appearance.
- Refined dashboard card hierarchy, spacing, typography and mobile navigation styling.
- Firestore debt and goal rules now enforce `paid <= amount` and `saved <= target`; the goal contribution action is capped at the target to match this validation.
- Service worker cache version advanced to `mw-v4`.

## Data preservation
This source update does not rename collections, change document IDs, migrate user records, or delete existing user data. The new Firestore constraints apply to future writes after rules deployment. Before deploying rules to production, test them with a disposable account and inspect any legacy debt or goal records that may already exceed their stated totals.


## Version 1.2.0
- Added richer transaction filtering and search.
- Added clear monthly budget and savings-goal progress.
- Added dashboard reminders for overdue schedules and schedules due within 7 days.
- Kept the existing Firestore data model and IDs intact.
- Reminder limitation: the app does not send push notifications while closed; scheduled processing still runs on app open.
