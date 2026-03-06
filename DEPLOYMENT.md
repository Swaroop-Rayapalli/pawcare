# 🚀 PawCare Deployment Guide (Comprehensive)

This guide takes you through setting up your project from scratch on **Render** (Backend) and **Netlify** (Frontend) using the new **JSON Storage** mode.

---

## 📂 Step 1: Backend Setup (Render)

1.  **Login to Render**: Go to [dashboard.render.com](https://dashboard.render.com).
2.  **Create Web Service**:
    *   Click **+ New** -> **Web Service**.
    *   Connect your GitHub repository (`pawcare`).
3.  **Configure Settings**:
    *   **Name**: `pawcare-backend` (or any name you like).
    *   **Region**: Choose the one closest to you (e.g., Singapore or US).
    *   **Runtime**: `Node`.
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
    *   **Instance Type**: `Free`.
4.  **Add Environment Variables**:
    *   Click the **Environment** tab.
    *   Add: `USE_JSON` = `true`
    *   Add: `PORT` = `3000`
    *   Add: `SESSION_SECRET` = `(type a random secret string)`
5.  **Get your URL**:
    *   Once deployed, copy the URL at the top left (e.g., `https://pawcare-backend-abc.onrender.com`).
    *   **CRITICAL**: Paste this URL into your `config.js` file (Line 8).

---

## 🎨 Step 2: Frontend Setup (Netlify)

1.  **Login to Netlify**: Go to [app.netlify.com](https://app.netlify.com).
2.  **Add New Site**:
    *   Click **Add new site** -> **Import from existing project**.
    *   Connect to GitHub and select your `pawcare` repository.
3.  **Configure Site**:
    *   **Base directory**: (Leave blank)
    *   **Build command**: (Leave blank, this is a static site)
    *   **Publish directory**: `.` (Current directory)
4.  **Deploy**: Click **Deploy site**.
5.  **Verify**: Open your Netlify URL and check if you can see the site!

---

## 🔄 Step 3: Updating your Site

Whenever you make changes to your code locally:

1.  **Commit & Push**:
    ```bash
    git add .
    git commit -m "Your update message"
    git push origin main
    ```
2.  **Auto-Update**: Both Render and Netlify will detect the push and update your site automatically!

---

## 🛠️ Developer Tools

| Command | Action |
| :--- | :--- |
| `npm run check:prod` | Checks if your production backend is live. |
| `npm start` | Starts your backend server locally. |
| `pawcare-data.json` | Open this file to view/edit your data manually! |

---

> [!WARNING]
> **Data Persistence Warning**:
> On the Free Tier of Render, your data in `pawcare-data.json` will be **RESTARTED** to the version in your GitHub repository every time the server restarts. 
> To keep your data permanent, you'll need to upgrade to a **Persistent Disk** on Render.
