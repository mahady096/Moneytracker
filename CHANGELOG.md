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
