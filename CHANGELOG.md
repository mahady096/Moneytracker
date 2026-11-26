# Changelog

## 1.1.0 — Development build
- Added dashboard quick actions for income, expense and transfers.
- Added a six-month cash-flow chart to the home dashboard.
- Added persistent Auto / Light / Dark appearance selection.
- Refined dashboard cards, typography, spacing and mobile navigation.
- Tightened Firestore debt and savings-goal validation.
- Capped goal contributions at the configured target to match Firestore validation.
- Advanced the service-worker cache namespace to `mw-v4`.

### Data compatibility
No Firestore collection names, document IDs or existing user records are changed by this source update. The stricter Firestore rules apply only after they are deployed. Review legacy debt and goal records before deploying the new rules.


## 1.2.0 — Smart finance update
- Added transaction filters for account, type, category and date range, alongside expanded search across both sides of transfers.
- Added a one-tap Clear filters action.
- Improved monthly budget progress with percentage used, remaining amount and overspend display.
- Improved savings-goal progress with percentage complete, remaining target and completion state.
- Added in-app payment reminders for overdue payments and payments due within the next 7 days. These are shown when the app is open; they are not background push notifications.
- Advanced the service-worker cache namespace to `mw-v5`.
- Corrected escaped newline characters in the Firestore rules source.

### Data compatibility
This update reuses the existing `records`, `budgets`, `goals` and `scheduled` collections and does not migrate, rename, delete or rewrite existing documents. Existing recurring schedules continue to follow the current app-open processing behavior.
