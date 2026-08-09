# ReminDUE upgrade guide

1. Export a JSON backup from the current app.
2. Replace the complete repository contents with the new package.
3. Make ONE Git commit.
4. Push once.
5. Open the GitHub Pages site and hard refresh if the old PWA is cached.
6. Keep the same GitHub repository and URL so local browser storage remains associated with the same origin.

The app continues to use `remindue.items.v1`, so existing data is intentionally preserved.
