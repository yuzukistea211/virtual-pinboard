# Pinboard

A minimal, distraction-free pure white canvas to organize, edit, and drag-and-drop Markdown sticky notes with interactive task lists, local storage persistence, and JSON backup.

---

## Features

- **Pure Canvas Workspace**: Unlimited, distraction-free workspace for your ideas.
- **Markdown Support**: Headings (`#`), bold (`**`), italic (`*`), quotes (`>`), code blocks, tables, and lists.
- **Interactive Checklists**: `- [ ]` and `- [x]` markdown tasks render as clickable checkboxes that persist immediately.
- **Drag & Resize**: Move notes anywhere on the canvas and freely resize from the corner handle.
- **Local Persistence & Backup**: Auto-saves to your browser's `localStorage` with JSON export and import options.

---

## Deploying to GitHub Pages

This project is configured out of the box for static deployment to GitHub Pages.

### Option 1: Automatic Deployment via GitHub Actions (Recommended)

1. Push or publish this repository to GitHub.
2. In your GitHub repository, go to **Settings** &rarr; **Pages**.
3. Under **Build and deployment** &rarr; **Source**, select **GitHub Actions**.
4. Push any commit to the `main` or `master` branch (or go to **Actions** and click **Run workflow**).
5. Your site will automatically build and publish to `https://<username>.github.io/<repo-name>/`.

### Option 2: Manual Deploy via Command Line

If you prefer deploying to a `gh-pages` branch directly:

```bash
# 1. Install dependencies
npm install

# 2. Build and publish to the gh-pages branch
npm run deploy
```

Then go to **Settings** &rarr; **Pages** in your repository and set the branch to `gh-pages` / `(root)`.

---

## Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build production static output in dist/
npm run build

# Preview production build locally
npm run preview
```
