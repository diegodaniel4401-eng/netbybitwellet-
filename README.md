# NETBYBIT Web Application

This repository contains the full source code for the NETBYBIT platform built with React, TypeScript, Tailwind CSS, Vite, and Express.

## How to Export & Download the Complete ZIP File

In the **AI Studio UI**:
1. Look at the top-right toolbar / header menu.
2. Click on the **Settings Gear / Menu icon** (or the **Export** option).
3. Select **Export to ZIP** (or **Export to GitHub**).
4. Save the `.zip` archive to your computer and extract it. You now have 100% of the project source code, assets, `package.json`, `firebase.json`, and all server files.

---

## Deploying to Firebase Hosting

### Step 1: Install Dependencies & Build
Open your terminal in the extracted project folder and run:
```bash
npm install
npm run build
```
This will compile all TypeScript files, Tailwind CSS, and React components into the `dist/` directory.

### Step 2: Initialize Firebase CLI
If you haven't installed Firebase tools yet:
```bash
npm install -g firebase-tools
firebase login
```

Initialize your Firebase project in the root folder:
```bash
firebase init hosting
```
- Select your existing Firebase project.
- When asked for public directory, enter `dist`.
- Configure as single-page app (rewrite all URLs to `/index.html`): `Yes`.

### Step 3: Deploy to Firebase
Run:
```bash
firebase deploy --only hosting
```
Your NETBYBIT platform will be live on your custom Firebase Hosting domain!
