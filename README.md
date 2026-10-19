# Pratle Events — Event Requirement Posting Platform

Full-stack implementation of the GoPratle developer-intern assignment: a
four-step form that posts **event requirements** for an **Event Planner**,
**Performer**, or **Crew**, with dynamic category-specific fields, full
client + server validation, and real API persistence.

> Candidate assignment build. Not an official GoPratle product.

## Repository layout

| Path        | What it is                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| **root**    | Frontend — Next.js (App Router) + TypeScript + Tailwind CSS + Zod          |
| **`backend/`** | Standalone Express + Mongoose (MongoDB) + Zod API — the assignment's backend  |
| **`src/app/api/`** | Embedded API with the **identical contract**, backed by PostgreSQL via Drizzle — lets the app run end-to-end without a separate process (used by the sandbox/preview and any deployment where a single service is preferred) |

The frontend API layer (`src/lib/api.ts`) reads **`NEXT_PUBLIC_API_URL`**:
- **unset** → talks to the embedded API (relative `/api`), or
- **set** (e.g. `http://localhost:5000/api`) → talks to the Express + MongoDB backend.

Both backends implement the same endpoints, response shapes, and
category-discriminated validation — swap the env var, no code changes.

## Frontend (`/`)

### Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

The embedded API needs `DATABASE_URL` (see `.env.example`). To use the
standalone backend instead, set `NEXT_PUBLIC_API_URL` and run `backend/`
(see below).

### Structure

```
src/
  app/            pages + embedded API routes (api/health, api/requirements)
  components/
    layout/       Header (progress), Sidebar (API status, live summary, tips)
    form/         RequirementForm — multi-step state + orchestration
    steps/        Step1Basics · Step2 (Planner/Performer/Crew) · Step3Details · Step4Review
    ui/           Button · Field/Input/Select/Textarea/ChipGroup · Badge · StepIndicator
    SuccessScreen confirmation + live DB verification
  lib/            api.ts (client + error taxonomy) · validation.ts (Zod)
  types/          requirement.ts (shared domain types + option catalogs)
  db/             Drizzle schema (requirements table mirroring the Mongo model)
```

### Multi-step state design

- One `FormState` holds **all** drafts (basics + planner + performer + crew +
  details). Navigating back/forward and **switching category never loses data**.
- `buildPayload()` assembles the submit body from *only* the draft matching
  the selected category, so stale, incompatible data can never ship.
- Per-step validation uses one authoritative schema
  (`requirementPayloadSchema`, a Zod discriminated union on `category`);
  issues are filtered to the current step before display.
- Duplicate submission is prevented with a ref guard + disabled button;
  network/server/validation failures are surfaced with distinct banners.
- Nothing is persisted to browser storage.

## Backend (`backend/`)

Express + Mongoose + Zod. Details, endpoint examples and deployment notes
are in [`backend/README.md`](backend/README.md).

```bash
cd backend
cp .env.example .env   # set MONGODB_URI (local Mongo or Atlas)
npm install
npm run dev            # http://localhost:5000
npm test               # vitest — validation contract (no DB needed)
```

### Endpoints (both backends)

| Method | Path                 | Success | Errors |
| ------ | -------------------- | ------- | ------ |
| GET    | `/api/health`        | 200 `{success, status, database}` | 503 if DB down |
| POST   | `/api/requirements`  | **201** `{success, message, data: {id, category, status}}` | 400 `{success:false, message:"Validation failed", errors:[{field,message}]}` |
| GET    | `/api/requirements/:id` | 200 `{success, data: <record>}` | 400 malformed id · 404 not found |

### MongoDB schema (Mongoose, timestamps enabled)

`eventName, eventType, startDate, endDate?, location, venue?,
category: planner|performer|crew, requirements (category-specific object),
additionalDetails, status: "submitted", createdAt, updatedAt`.
Category enums and shape are enforced **server-side** via the Zod
discriminated union before Mongoose ever sees the data.

## Environment variables

**Frontend** (`.env.example`)
- `DATABASE_URL` — **required**; PostgreSQL for the embedded API (Neon on
  Vercel, local Postgres in dev).
- `NEXT_PUBLIC_API_URL` — optional; point at the Express API to bypass the
  embedded one.

**Backend** (`backend/.env.example`)
- `PORT`, `MONGODB_URI`, `FRONTEND_URL` (CORS), `NODE_ENV`.
- Never commit real credentials.

## Testing

### Automated

- `backend` → `npm test` (vitest): valid planner/performer/crew payloads;
  planner-with-performer-requirements rejected; unknown category; missing
  `eventName` reports the exact field; empty services; duration floor;
  date-range cross-field rule.
- Frontend → `npm run typecheck` + `npm run build` (strict TS).

### Manual checklist

1. Submit a Planner requirement → 201, success screen, ID shown, record
   verifies against the DB.
2. Submit a Performer requirement (pick **DJ** → genre field appears; pick
   **Comedian** → it disappears).
3. Submit a Crew requirement.
4. Fill Step 2 → Back → Forward: data intact.
5. Continue with required fields empty → per-field errors, no navigation.
6. Set end date < start date → "End date can't be earlier…" error.
7. Change category mid-flow → other drafts preserved, payload stays clean.
8. POST performer-shaped `requirements` with `category: "planner"` via curl
   → 400 with field errors (server does not trust the client).
9. Stop the API / use a bad `NEXT_PUBLIC_API_URL` → network-error banner,
   entries preserved.
10. Double-press Submit → single request (guard + disabled state).
11. `GET /api/requirements/<id>` → 200 with the saved record.
12. `GET /api/requirements/not-a-valid-id` → 400; random UUID → 404.
13. Check the record exists (embedded API: `GET /api/requirements` list, or
    Mongo: `db.requirements.find()` in Atlas).
14. Resize to mobile — form stacks, no horizontal scroll.

## Deployment

The recommended path is **one service**: the Next.js app (with its embedded
API) on **Vercel**, backed by **Neon Postgres**.

**Frontend + embedded API → Vercel**

1. Create a free Postgres at [neon.tech](https://neon.tech) and copy its
   connection string.
2. Create the table: `DATABASE_URL=… npm run db:push`.
3. Import the repo into Vercel (framework preset **Next.js**) and set
   `DATABASE_URL` for Production/Preview/Development.
4. Deploy. Only `DATABASE_URL` is required — leave `NEXT_PUBLIC_API_URL` unset.

Full walkthrough (incl. SQL fallback and troubleshooting): [`DEPLOYMENT.md`](DEPLOYMENT.md).

**Backend → Render** (optional, only if you use the Express + MongoDB API)
Web Service, root `backend`; build `npm install`, start `npm run build && npm start`;
env: `PORT`, `MONGODB_URI`, `FRONTEND_URL=https://<frontend>.vercel.app`,
`NODE_ENV=production`. CORS then allows your deployed origin automatically.
Set `NEXT_PUBLIC_API_URL=https://<backend>.onrender.com/api` on the frontend to
switch to it.

**MongoDB → Atlas**: create a free cluster, a database user, allow your IP
(or `0.0.0.0/0` for Render egress), copy the connection string into
`MONGODB_URI`.

## Architecture walkthrough (5–7 min script)

1. **Problem** — event organisers need to post structured requirements to
   three very different vendor types; the form must stay concise but complete.
2. **Contract first** — one Zod discriminated union on `category` defines the
   payload; it's used for per-step client validation *and* as the server's
   source of truth, so client and server can never drift.
3. **Client** — a single `FormState` (all drafts) makes step navigation and
   category switching lossless; `buildPayload()` selects only the active
   category's draft; a ref guard blocks double submits; errors carry a
   taxonomy (validation / network / server) that drives the UI.
4. **Server** — routes → controller (safeParse → 400 with per-field errors)
   → service (date-range rule, ISO→Date) → Mongoose model (enums,
   timestamps, indexes). Central error handler never leaks internals.
5. **Data** — category-specific data lives in one structured sub-document;
   the union makes mismatched categories structurally impossible.
6. **Ops** — env-driven config, CORS allow-list, `.env.example` for both
   apps, Render + Vercel + Atlas deployment path, vitest for the validation
   contract.
7. **Trade-offs** — React state over a form library (multi-step + dynamic
   fields favour explicit, testable state); JSON sub-document over a
   per-category collection (one requirement is always read as a whole).

## Known limitations

- The Express backend's **MongoDB write path is validated by unit tests on
  the Zod contract**, but not against a live Atlas instance in this
  sandbox — run the `backend` manual checklist once you have a
  `MONGODB_URI`.
- The embedded API uses PostgreSQL/UUIDs (so its IDs are UUIDs, Mongo IDs
  are ObjectIds); the UI treats IDs as opaque strings.
- No authentication or vendor-side tooling (out of scope by design).
