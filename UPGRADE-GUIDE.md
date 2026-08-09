# Upgrade Guide

## Safe update process

1. Open the current ReminDUE app.
2. Go to **More**.
3. Select **Export backup**.
4. Save the JSON file safely.
5. Replace the application files in the same GitHub repository.
6. Keep the repository name and GitHub Pages URL unchanged.
7. Open the app and verify that existing items are present.
8. If needed, use **Import backup**.

## Versioning rule

Application code and user data are deliberately separated.

- Application code: GitHub repository files
- User data: browser storage
- Backup: downloadable JSON file

Future database changes should use migration scripts rather than changing or deleting the current storage key.

## v1.1
The same `remindue.items.v1` storage key is retained. Existing records remain available. New completion date/notes fields are optional for legacy completed records and are populated for new completions. Export a backup before upgrading.


## v1.2 fixes
- Fixed the Insights/legacy All Items rendering reference that prevented the Calendar screen from initializing.
- Added Maintenance explicitly to the Add Item type selector.
- Calendar date selection now renders the selected date agenda and re-renders when entering Calendar.
- Service-worker cache version bumped to v1.2.
