# Money Tracker 2.5.1 Optimized — Release Notes

## Included optimizations
- Recent transaction listener starts with a bounded 3-month window and fetches up to 1,000 documents per page; older pages/months load on demand with a cursor, and reports warn if more data is available.
- Main finance collections are user-scoped under the existing `users/{uid}` path. Existing document IDs and data paths are retained.
- Automatic cloud backup checks at most once every 30 days while the app is opened online; manual backup remains available.
- Cloud backup payloads are chunked at 180,000 characters and uploaded in small batches of 10 documents.
- Backup retention keeps four completed backups and removes chunks in bounded delete batches.
- Support inbox fetches are bounded; admin user list is limited to 100 profiles.
- Admin authorization requires a verified `admin.moneytracker@gmail.com` account and the matching `admins/{uid}` document; Firestore Rules enforce the same condition.
- Blocking uses a protected `blockedUsers/{uid}` marker; rules also honor legacy `profiles/{uid}.blocked` values, and blocked users cannot delete their own profile to bypass a ban.
- Service-worker cache namespace is bumped to `mw-v14`.

## Important deployment steps
1. Export a fresh independent JSON backup for a test account and preserve production backups.
2. Review and publish the included `firestore.rules` in Firebase Console. These rules introduce `blockedUsers/{uid}` and are required for the new block enforcement.
3. Confirm `firebase-config.js` points to the existing Firebase project and restrict the Web API key by HTTP referrer in Google Cloud Console.
4. Deploy the static assets to the existing Cloudflare Workers site.
5. Test login, existing data visibility, manual backup, restore, admin access, block/unblock, offline launch, and Android TWA navigation with a disposable account before public promotion.

## Firebase usage notes
- The app does not guarantee that a project will remain within the Spark quota. Usage depends on active users, transaction volume, device reconnects, and manual backups.
- Automatic backup is client-triggered, not a scheduled server job. It runs only when a user opens the app online.
- Manual backups and restores consume reads/writes proportional to the user's stored data.
- Transaction history is intentionally bounded in the live listener; older records are fetched only when the user asks to load them.
- Do not reduce retention or disable backups without informing users. Keep an independent export before restoring.

## Verification status
JavaScript syntax, JSON resource parsing, and ZIP integrity were checked. This package has not been live-tested against production Firebase or across physical Android devices. Treat it as a release candidate until the deployment checklist above passes.
