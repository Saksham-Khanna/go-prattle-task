# Last session — resume tomorrow

Saved: 2026-10-20. Do not deploy or push until this work is finished and reviewed.

## Prompt to resume

Inspect the existing GoPratle assignment project. The frontend and all four form phases are already working. The problem is that the deployed app uses Next.js API routes with Neon PostgreSQL, whereas the assignment requires Node.js + Express + MongoDB.

Check whether an Express + Mongoose backend already exists. Reuse and fix it if possible, connect the frontend submission flow to that backend, and remove the old PostgreSQL path only when safe. Keep the existing UI unchanged. Prepare the backend for Render and the frontend for Vercel. Do not deploy or push anything. Report the exact changes and any manual setup needed for MongoDB Atlas.

No UI changes. Keep the app functionality the same.

## Already found (not finished)

- `backend/` already is Express + Mongoose + Zod. Contract matches the frontend payload (planner / performer / crew).
- Frontend still posts through `src/lib/api.ts` to relative `/api` (Next routes in `src/app/api/*` + Drizzle/Neon).
- `NEXT_PUBLIC_API_URL` already switches the client to an external API. UI does not need to change.
- Gaps to fix before removing Postgres:
  - GET `/api/requirements/:id` returns a Mongoose doc (`_id`, Date objects). Success screen expects `id`, ISO date strings (`yyyy-mm-dd` for start/end), and ISO `createdAt` / `updatedAt`.
  - Serialize the document in the backend before responding.
  - CORS: set `FRONTEND_URL` to the Vercel origin.
  - Point the frontend at the Express API via `NEXT_PUBLIC_API_URL`.
  - Remove `src/app/api/*`, `src/db`, Drizzle config/migrations, and Postgres deps only after the Express path is the one the form uses.
- Render: root `backend`, build `npm install && npm run build`, start `npm start`. Env: `MONGODB_URI`, `FRONTEND_URL`, `NODE_ENV=production`. `PORT` is injected.
- Vercel: Next.js preset. Env: `NEXT_PUBLIC_API_URL=https://<render-service>.onrender.com/api`. `DATABASE_URL` no longer required after the Postgres path is removed.
- Atlas (manual, not done): free cluster, DB user, network access `0.0.0.0/0` for Render, connection string into `MONGODB_URI`. Database name can stay `gopratle-events`.

## Do not

- Change form UI or the four-step flow.
- Deploy or `git push`.
- Commit the Neon password. `.env.local` is gitignored and currently holds `DATABASE_URL`.
