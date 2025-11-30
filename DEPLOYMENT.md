# 🚀 Deployment Guide

This guide will help you deploy **SusuFlow-AI** so everyone can use it.

## 1. Frontend Deployment (Vercel)
The easiest way to deploy the Next.js frontend is using **Vercel**.

### Steps:
1.  **Push your code to GitHub** (You've already done this!).
2.  Go to [Vercel.com](https://vercel.com) and sign up/login with GitHub.
3.  Click **"Add New..."** -> **"Project"**.
4.  Import your `SusuFlow-AI` repository.
5.  **Configure Project**:
    *   **Framework Preset**: Next.js (should be auto-detected).
    *   **Root Directory**: Click "Edit" and select `frontend`.
6.  **Environment Variables**:
    Expand the "Environment Variables" section and add the following (copy values from your local `.env.local`):
    *   `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`
    *   `NEXT_PUBLIC_FACTORY_ADDRESS`
    *   `NEXT_PUBLIC_CUSD_ADDRESS`
    *   `NEXT_PUBLIC_SELF_HUB`
7.  Click **"Deploy"**.

🎉 **Success!** Vercel will give you a live URL (e.g., `susuflow-ai.vercel.app`). You can share this link with everyone!

---

## 2. AI Agent Deployment (Railway)
The NoahAI Agent needs to run 24/7 to monitor pools and trigger payouts. **Railway** is a great choice for this.

### Steps:
1.  Go to [Railway.app](https://railway.app) and login with GitHub.
2.  Click **"New Project"** -> **"Deploy from GitHub repo"**.
3.  Select `SusuFlow-AI`.
4.  **Configure Service**:
    *   Railway might try to auto-detect. We want to deploy the `agent` folder.
    *   Go to **Settings** -> **Root Directory** and set it to `/agent`.
5.  **Environment Variables**:
    Go to the **Variables** tab and add:
    *   `CELO_RPC_URL`: `https://forno.celo.org`
    *   `PRIVATE_KEY`: (The private key of the wallet that will trigger payouts - **ensure it has some CELO for gas**)
    *   `FACTORY_ADDRESS`: (Same as frontend)
    *   `CUSD_ADDRESS`: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
6.  **Start Command**:
    *   Railway should auto-detect `npm start`, but ensure your `agent/package.json` has a start script (e.g., `ts-node src/poolMonitor.ts`).
    *   *Note: You might need to update `agent/package.json` to include a build step if using TypeScript in production.*

---

## 3. Mobile Mini App (PWA)
Once deployed on Vercel, your app is automatically a PWA!
*   Users can open the Vercel URL on their phone.
*   They can tap **"Add to Home Screen"** to install it as a native-like app.
