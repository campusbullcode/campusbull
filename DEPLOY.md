# Campus Bull — Deployment Guide

Architecture:

- **Frontend** (Vite + React) → **Vercel**
- **Backend** (Express + Prisma) → **Render**
- **Database** (Neon Postgres) → already hosted

Deploy the **backend first** (you need its URL for the frontend), then the frontend.

---

## 1. Backend → Render

1. Go to <https://dashboard.render.com> → **New +** → **Web Service**.
2. Connect the GitHub repo `bullcampus-bot/CampusBull-`.
3. Render auto-detects `render.yaml`. Confirm these settings:
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `node server/index.js`
   - **Plan:** Free
4. Add the environment variables (Render → service → **Environment**):

   | Key                          | Value                                                                 |
   | ---------------------------- | --------------------------------------------------------------------- |
   | `DATABASE_URL`               | `postgresql://neondb_owner:...@ep-wispy-breeze-aqhmpdnh.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require` |
   | `JWT_SECRET`                 | any long random string (keep it secret)                               |
   | `FRONTEND_URL`               | your Vercel URL — fill in after step 2 (e.g. `https://campus-bull.vercel.app`) |
   | `NODE_ENV`                   | `production`                                                          |

   > `RENDER_EXTERNAL_URL` is injected by Render automatically — it powers the keep-alive self-ping so the free tier doesn't sleep.

5. **Deploy.** When live, copy the service URL, e.g. `https://campus-bull-api.onrender.com`.
6. Test it: open `https://<your-render-url>/api/health` → should return `{"status":"ok",...}`.

---

## 2. Frontend → Vercel

1. Go to <https://vercel.com/new> → import the same GitHub repo.
2. Vercel auto-detects Vite via `vercel.json`. Confirm:
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add environment variable (Vercel → project → **Settings → Environment Variables**):

   | Key            | Value                                       |
   | -------------- | ------------------------------------------- |
   | `VITE_API_URL` | your Render backend URL from step 1.5       |

   > Set it for **Production** (and Preview if you want). `VITE_*` vars are baked in at build time, so redeploy after changing it.

4. **Deploy.** Copy your Vercel URL, e.g. `https://campus-bull.vercel.app`.

---

## 3. Wire them together

1. Back in Render, set `FRONTEND_URL` to your Vercel URL → save (triggers a redeploy).
   - CORS already allows any `*.vercel.app` origin, so preview deploys work too.
2. Open the Vercel URL and test login → it should hit the Render backend.

---

## Local development

```bash
npm run dev        # runs backend (port 5000) + vite (port 5173) together
```

- Local frontend proxies `/api` → `localhost:5000` (see `vite.config.js`).
- Requires `.env` with `DATABASE_URL`, `JWT_SECRET`, `PORT=5000`.
- Leave `VITE_API_URL` **unset** (or commented) locally so the proxy is used.

---

## Notes / gotchas

- **Free Render tier sleeps after 15 min idle.** The self-ping keep-alive (`server/index.js`) mitigates this, but the very first request after a deploy can be slow (~30s cold start).
- **`VITE_API_URL` is build-time.** Changing it on Vercel requires a redeploy to take effect.
- **DB credentials:** never hardcode them again — `server/utils/db.js` reads `DATABASE_URL` from the environment. The old password committed in git history should be considered compromised (rotate it in Neon if you haven't).
