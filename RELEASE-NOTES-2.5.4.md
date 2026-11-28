# Money Tracker 2.5.4 — Dashboard Summary Details

- Assets: opens accounts with positive balances.
- Debts: opens accounts with negative balances; debt is displayed as a positive amount.
- Income: opens current-month income transactions.
- Spent: opens current-month expense transactions.

The detail view is read-only and uses data already loaded by the app. Existing Firestore collections, document IDs, balances, transaction logic, authentication, and backup workflows are not intentionally changed. The service-worker cache namespace is updated to refresh app files.

Before public release, test each card with a test account and complete Firebase and physical Android-device checks.
