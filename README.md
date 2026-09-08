# Pinboard

A minimal, distraction-free pure white canvas to organize, edit, and drag-and-drop Markdown sticky notes with interactive task lists, local storage persistence, and JSON backup.


**ALL OF THIS IS PURELY VIBE-CODED.**

---

## Features

- **Pure Canvas Workspace**: Unlimited, distraction-free workspace for your ideas.
- **Markdown Support**: Headings (`#`), bold (`**`), italic (`*`), quotes (`>`), code blocks, tables, and lists.
- **Interactive Checklists**: `- [ ]` and `- [x]` markdown tasks render as clickable checkboxes that persist immediately.
- **Drag & Resize**: Move notes anywhere on the canvas and freely resize from the corner handle.
- **Local Persistence & Backup**: Auto-saves to your browser's `localStorage` with JSON export and import options.

---

## Deploying to GitHub Pages

If your site shows a blank page, it is because GitHub Pages is attempting to serve raw TypeScript source files rather than the compiled static build. Choose one of the following methods:

### Method 1: Automatic Deployment with GitHub Actions (Recommended)

This compiles and publishes your app automatically on every push without having to manually build.

1. In your GitHub repository, navigate to **Settings** &rarr; **Pages** (in the left sidebar).
2. Under **Build and deployment** &rarr; **Source**, click the dropdown and choose **GitHub Actions** (instead of "Deploy from a branch").
3. Go to the **Actions** tab in your repository, click the **Deploy to GitHub Pages** workflow on the left, and click **Run workflow** (or simply push a new commit to `main`).
4. In ~60 seconds, your site will be live at `https://<username>.github.io/<repo-name>/`.

---

### Method 2: Deploy from the `/docs` Folder (No GitHub Actions needed)

If you prefer using the standard **"Deploy from a branch"** option:

1. Build the production files into the `/docs` folder:
   ```bash
   npm run build:docs
   git add docs/
   git commit -m "Build static site into docs"
   git push origin main
   ```
2. In your repository, go to **Settings** &rarr; **Pages**.
3. Under **Build and deployment**:
   - **Source**: Select **Deploy from a branch**
   - **Branch**: Select `main` (or `master`)
   - **Folder**: Change from `/ (root)` to **`/docs`**
   - Click **Save**.
4. GitHub Pages will immediately serve the pre-compiled static app from the `/docs` folder.

---

### Method 3: Deploy to the `gh-pages` Branch via Command Line

```bash
# Build and push the dist folder to the gh-pages branch
npm run deploy
```
Then in **Settings** &rarr; **Pages**, select branch `gh-pages` and folder `/ (root)`.

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
