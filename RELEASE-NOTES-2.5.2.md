# Money Tracker 2.5.2 Final Optimization — Release Notes

## Included
- Verified Super Admin email enforcement in the app and Firestore security rules. The admin account must have a verified email and an `admins/{uid}` document whose ID exactly matches the Firebase Auth UID.
- Cursor-based transaction pagination, loading up to 1,000 records per page, with older records loaded on demand.
- Report warnings when more transactions are available than are currently loaded.
- Service-worker cache namespace advanced to `mw-v15`.
- App profile version marker updated to `2.5.2`.
- Changelog escaped-newline formatting corrected.

## Compatibility and safety
- Android package association remains `com.app.moneytracker`.
- Existing signing certificate fingerprint in `.well-known/assetlinks.json` is retained.
- Existing Firestore user collections and document IDs are retained; no bulk migration or deletion is performed.
- The original Android signing keystore and passwords are not included.

## Before public release
Publish and review `firestore.rules` in Firebase Console, then test sign-in, verified admin access, user blocking/unblocking, transactions, cloud backup/restore, offline launch and the Android TWA using a disposable test account. This package has not been live-tested against the production Firebase project.
