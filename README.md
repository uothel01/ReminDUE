# ReminDUE

**Before it’s due, we remind you.**

ReminDUE is a lightweight installable web app (PWA) for tracking:

- Bills and payments
- Insurance and document renewals
- Doctor appointments
- Subscriptions
- Repetitive personal commitments

## Main features

- Add one-time and recurring items
- Track upcoming, due-today and overdue items
- Mark payments as paid or commitments as completed
- Automatically create the next occurrence for recurring items
- Monthly calendar and agenda
- Search and filters
- Browser notifications
- Offline usage
- JSON backup and restore
- CSV export
- Local device storage
- Installable on Android through Chrome

## GitHub Pages deployment

1. Create a new public GitHub repository, for example `remindue`.
2. Upload the **contents** of this folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/(root)**
5. Click **Save**.
6. GitHub will publish the app at an address similar to:
   `https://YOUR-USERNAME.github.io/remindue/`

## Install on Android

1. Open the GitHub Pages web address in Google Chrome.
2. Tap the three-dot menu.
3. Choose **Add to Home screen** or **Install app**.
4. Confirm installation.

## Data persistence during upgrades

User data is stored in the browser using the key:

`remindue.items.v1`

Replacing the app files in GitHub will not remove this stored data, as long as:

- The GitHub Pages web address remains the same.
- The user does not clear the browser/site data.
- The app is not moved to a different domain or repository path.

Use **More → Export backup** regularly. Before any major upgrade, export a backup.

## Important notification limitation

This first PWA version checks and shows notifications when the app is opened.

Exact scheduled background notifications—when the app is fully closed for several days—require a future enhancement using one of these approaches:

- Push notification service and a small backend
- Native Android wrapper
- Trusted periodic background service

The current version keeps the architecture ready for that future expansion.

## Folder structure

```text
ReminDUE/
├── index.html
├── manifest.webmanifest
├── sw.js
├── assets/
│   └── icons/
└── src/
    ├── css/
    │   └── styles.css
    └── js/
        ├── app.js
        ├── dates.js
        ├── notifications.js
        └── storage.js
```
