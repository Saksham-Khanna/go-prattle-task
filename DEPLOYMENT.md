# Deployment Guide — Vercel + Render + MongoDB Atlas

This app uses a **separate Express + MongoDB backend** (`backend/`) as required
by the assignment. The frontend (Next.js) talks to the backend via
`NEXT_PUBLIC_API_URL`.

```
GitHub repo ──▶ Vercel (Next.js frontend) ──▶ Render (Express API) ──▶ MongoDB Atlas
```

---

## 1. MongoDB Atlas (Database)

1. Create a free cluster at <https://cloud.mongodb.com>.
2. **Database Access** → Add New Database User → Username + Password (save these).
3. **Network Access** → Add IP Address → `0.0.0.0/0` (allows Render egress).
4. **Clusters** → Connect → Drivers → Copy connection string:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
5. Append your database name: `.../gopratle-events?retryWrites=true&w=majority`.
   This full string is your **`MONGODB_URI`** for Render.

---

## 2. Push the code to GitHub

```bash
# on github.com: create an empty repo (no README), then:
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

---

## 3. Backend → Render

1. Go to <https://dashboard.render.com> → **New** → **Web Service**.
2. Connect the GitHub repo you just pushed.
3. **Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run build && npm start`
4. **Environment Variables** (add all):
   | Variable       | Value                                                      |
   | -------------- | ---------------------------------------------------------- |
   | `MONGODB_URI`  | Your Atlas connection string from step 1                   |
   | `FRONTEND_URL` | Your Vercel URL (e.g. `https://my-app.vercel.app`)         |
   | `NODE_ENV`     | `production`                                               |
   | `PORT`         | (leave empty — Render injects it automatically)            |
5. Click **Create Web Service**.
6. Wait for the deploy to finish. In the logs you should see:
   ```
   [db] connected to MongoDB at <host>/gopratle-events
   [server] requirements API listening on http://0.0.0.0:<PORT> (production)
   ```
7. Test the health endpoint:
   `GET https://<your-service>.onrender.com/api/health`
   → `{ "success": true, "database": "connected", "status": "ok", ... }`

---

## 4. Frontend → Vercel

1. Go to <https://vercel.com/new> → **Import** the same GitHub repo.
2. **Framework Preset**: **Next.js** (auto-detected).
3. **Root Directory**: (repo root — leave default).
4. **Environment Variables**:
   | Variable              | Value                                             |
   | --------------------- | ------------------------------------------------- |
   | `NEXT_PUBLIC_API_URL` | `https://<your-render-service>.onrender.com/api`  |
5. Click **Deploy**.
6. Vercel runs `npm install` → `next build`. No `DATABASE_URL` needed.

---

## 5. Verify end-to-end

- Open your Vercel URL.
- Submit a requirement → success screen with an ID.
- In Atlas: **Browse Collections** → `gopratle-events` → `requirements` → you should see the document.

---

## Environment Variables Summary

### Frontend (Vercel)

| Variable              | Required | Purpose                                                    |
| --------------------- | -------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | **Yes**  | Full URL of the Express API (Render service) + `/api` path |

### Backend (Render)

| Variable       | Required | Purpose                                                       |
| -------------- | -------- | ------------------------------------------------------------- |
| `MONGODB_URI`  | **Yes**  | MongoDB Atlas connection string (with DB name appended).      |
| `FRONTEND_URL` | **Yes**  | CORS allow-list origin (your Vercel URL).                     |
| `NODE_ENV`     | **Yes**  | `production`                                                  |
| `PORT`         | No       | Injected by Render; do not set manually.                      |

---

## Troubleshooting

- **Backend health returns 503 / "database: disconnected"** → `MONGODB_URI` is wrong, or Atlas Network Access doesn't allow `0.0.0.0/0`. Check Render logs.
- **Frontend shows "Could not reach the requirements API"** → `NEXT_PUBLIC_API_URL` is wrong or missing trailing `/api`. Check Vercel env vars and redeploy.
- **CORS error in browser console** → `FRONTEND_URL` in Render does not match your Vercel origin exactly (protocol + host, no trailing slash).
- **Build fails on Vercel** → Run `npm run build` locally first; check for TypeScript errors.
- **`npm run dev` fails locally (frontend)** → Ensure `backend` is running on `localhost:5000` and `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:5000/api`.

---

## Local Development

```bash
# Terminal 1: Backend
cd backend
cp .env.example .env
# Edit .env → set MONGODB_URI (local Mongo or Atlas), FRONTEND_URL=http://localhost:3000
npm install
npm run dev         # http://localhost:5000

# Terminal 2: Frontend
cd ..               # repo root
cp .env.example .env.local   # or create manually
# Edit .env.local → NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev         # http://localhost:3000
```