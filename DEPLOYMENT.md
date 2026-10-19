# Deployment Guide — Vercel + Neon Postgres

This app ships with an **embedded API** (`src/app/api/*`) backed by PostgreSQL
via Drizzle, so the whole product deploys as **one service**. No separate
backend process is required.

```
GitHub repo ──▶ Vercel (Next.js app + embedded API) ──▶ Neon Postgres
```

The optional `backend/` (Express + MongoDB) is **not** needed for this path.

---

## 1. Create the database (Neon, free)

1. Sign up at <https://neon.tech> and create a project.
2. Copy the **connection string** — it looks like:

   ```
   postgresql://<user>:<password>@ep-xxxxx.<region>.aws.neon.tech/<db>?sslmode=require
   ```

   Keep `?sslmode=require` on the end. This is your `DATABASE_URL`.

> Any PostgreSQL works (Supabase, Railway, Render Postgres). Neon is just the
> recommended free option.

## 2. Create the `requirements` table

A migration is already committed under `drizzle/`. From the repo root, with
your `DATABASE_URL` in the shell:

```powershell
# PowerShell (Windows)
$env:DATABASE_URL = "postgresql://…neon.tech/db?sslmode=require"
npm install
npm run db:migrate     # applies drizzle/*.sql

# Bash / macOS / Linux
export DATABASE_URL="postgresql://…neon.tech/db?sslmode=require"
npm install
npm run db:migrate
```

`npm run db:push` also works (diffs `src/db/schema.ts` straight to the DB)
if you prefer not to track migrations. `npm run db:generate` creates a new
migration after schema changes. This only needs to be done once per database.

<details>
<summary>Alternative: run this SQL directly in the Neon SQL editor</summary>

```sql
create extension if not exists "pgcrypto";

create table if not exists "requirements" (
  "id" uuid primary key default gen_random_uuid() not null,
  "event_name" text not null,
  "event_type" text not null,
  "start_date" date not null,
  "end_date" date,
  "location" text not null,
  "venue" text,
  "category" text not null,
  "requirements" jsonb not null,
  "additional_details" jsonb not null,
  "status" text default 'submitted' not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
```

</details>

## 3. Push the code to GitHub

A git repository is already initialised with an initial commit.

```bash
# on github.com: create an empty repo (no README), then:
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

## 4. Deploy on Vercel

1. Go to <https://vercel.com/new> and **import** the GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Leave build settings default.
3. Open **Environment Variables** and add:

   | Name           | Value                        | Environments                     |
   | -------------- | ---------------------------- | -------------------------------- |
   | `DATABASE_URL` | your Neon connection string  | Production, Preview, Development |

   > Optional: `NEXT_PUBLIC_API_URL` only if you deploy `backend/` separately.
   > Leave it **unset** to use the embedded API.

4. Click **Deploy**. Vercel runs `npm install` + `next build`.

## 5. Verify

- `https://<your-app>.vercel.app/api/health` → `{ "success": true, "database": "connected" }`
- Open the app, submit a requirement → success screen with an ID.
- `https://<your-app>.vercel.app/api/requirements` lists saved records.

---

## Environment variables

### Frontend / embedded API (Vercel)

| Variable               | Required | Purpose                                                                 |
| ---------------------- | -------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`         | **Yes**  | PostgreSQL for the embedded API. Required at **build** and runtime.     |
| `NEXT_PUBLIC_API_URL`  | No       | Point the frontend at the standalone `backend/` instead of embedded API. |

### Standalone backend (`backend/`, optional)

Only needed if you deploy the Express + MongoDB service separately.

| Variable       | Required | Purpose                                    |
| -------------- | -------- | ------------------------------------------ |
| `PORT`         | No       | API port (Render injects it).              |
| `MONGODB_URI`  | **Yes**  | MongoDB / Atlas connection string.         |
| `FRONTEND_URL` | No       | Allowed CORS origin (your Vercel domain).  |
| `NODE_ENV`     | No       | `production` on the server.                |

See [`backend/README.md`](backend/README.md) for the Render path.

---

## Troubleshooting

- **Build fails / "DATABASE_URL is required"** — the variable is read when the
  API route loads. Add `DATABASE_URL` in Vercel **before** deploying, then
  redeploy.
- **`/api/health` returns 503** — the DB is unreachable. Check the connection
  string (password, `sslmode=require`, no surrounding quotes).
- **`relation "requirements" does not exist`** — you skipped step 2. Run
  `npm run db:push`.
- **Submissions fail only on the deployed site** — the frontend and DB may be
  using different projects. Confirm `DATABASE_URL` is set for the Production
  environment in Vercel.
