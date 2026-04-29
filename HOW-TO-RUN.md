# ⚠️ How to Run CampusHub Locally

## The Problem with Opening Files Directly

If you **double-click `index.html`** or open it via `file://` in your browser, you will see these errors:

- `Tracking Prevention blocked access to storage`
- Articles may not load
- Login state won't persist between pages

This is **not a bug in the code** — it's a browser security restriction. Chrome and Edge block IndexedDB/localStorage on `file://` URLs, which Firebase Auth needs.

---

## ✅ The Fix: Use a Local Web Server

You need to serve the files over HTTP. Here are three easy ways:

### Option 1 — VS Code (Recommended)
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **"Open with Live Server"**
3. Your browser opens at `http://127.0.0.1:5500` — everything works!

### Option 2 — Python (built-in, no install needed)
Open a terminal in the `merged/` folder and run:
```bash
# Python 3
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

### Option 3 — Node.js
```bash
npx serve .
```
Then open the URL it gives you.

---

## Pages

| URL | Description |
|-----|-------------|
| `/index.html` | Homepage with articles |
| `/pages/rubrics-public.html` | Public fun rubrics page |
| `/pages/admin.html` | Admin panel (requires admin role) |
| `/pages/redactor-dashboard.html` | Editor panel |
| `/pages/user-dashboard.html` | My articles |
| `/pages/submit-article.html` | Submit a new article |

---

## First-time Admin Setup

1. Register an account normally
2. Open `/pages/create-admin.html` or `/pages/force-admin.html` to set your account as admin
3. From then on, use the Admin Panel to manage users, articles, and rubrics
