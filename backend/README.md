# Event Requirements API (Express + MongoDB)

Standalone backend for the GoPratle event-requirement assignment. Express +
Mongoose + Zod, with server-side validation that is independent of the
frontend: payloads are validated against a **category-discriminated Zod
union** with **strict** requirement objects, so a `planner` record can never
carry performer-only or crew-only data — including when the expected planner
fields are also present.

## Quick start (local)

Requires Node.js 20.19+ (the test runner's in-memory MongoDB package requires it).

```bash
cd backend
cp .env.example .env        # then set MONGODB_URI (local Mongo or Atlas)
npm install
npm run dev                 # tsx watch → http://localhost:5000
```

Production:

```bash
npm run build
npm start                   # node dist/server.js
```

Run the test suite (validator + API; the API tests start an in-memory MongoDB,
so no Atlas account is needed — the first run downloads a MongoDB binary):

```bash
npm test                    # vitest run
```

The API suite covers `201` creation/persistence, `400` invalid and
category-mismatched payloads, `400` malformed MongoDB IDs, and `404` for a
valid but nonexistent ObjectId. It also verifies the serialized
`yyyy-mm-dd` / ISO timestamp response shape.

### Validation rules worth knowing

- `startDate` must be a real calendar date and **today or later** (UTC).
- `endDate` is optional; multi-day events are valid when it is on/after the
  start date. A single-day event uses `endDate: null` (or the same date).
- Unknown keys inside `requirements` are rejected, so a Performer or Crew
  field sent with `category: "planner"` returns `400`.
- Zod issues are converted to short, field-specific messages before they are
  returned to the client.

## Environment variables

| Variable       | Description                                   | Example                              |
| -------------- | --------------------------------------------- | ------------------------------------ |
| `PORT`         | API port                                      | `5000`                               |
| `MONGODB_URI`  | MongoDB / Atlas connection string             | `mongodb+srv://<user>:<pass>@…/events` |
| `FRONTEND_URL` | Allowed CORS origin (localhost:3000 also OK)  | `http://localhost:3000`              |
| `NODE_ENV`     | `development` \| `test` \| `production`       | `production`                         |

Never commit real connection strings — keep them in `.env` (git-ignored).

## Endpoints

### `GET /api/health`

Returns `200` when MongoDB is connected, `503` with
`"database": "disconnected"` otherwise.

```json
{ "success": true, "status": "ok", "database": "connected", "uptime": 42 }
```

### `POST /api/requirements`

Validates the full payload, stores it in MongoDB, returns **201**:

```json
{
  "success": true,
  "message": "Requirement created successfully",
  "data": { "id": "665f…", "category": "performer", "status": "submitted" }
}
```

Validation failure returns **400** with per-field errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "eventName", "message": "Event name is required" }]
}
```

Example request:

```bash
curl -X POST http://localhost:5000/api/requirements \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "Circuitry 2027",
    "eventType": "college-fest",
    "startDate": "2027-03-14",
    "endDate": "2027-03-15",
    "location": "Pune",
    "venue": "Central auditorium",
    "category": "performer",
    "requirements": {
      "performanceType": "dj",
      "genreOrStyle": "EDM",
      "numberOfPerformers": 2,
      "durationMinutes": 60,
      "budgetRange": "50k-1l",
      "technicalSetup": "DJ booth + PA for 500",
      "experienceRequirement": "Festival headliner preferred"
    },
    "additionalDetails": {
      "facilities": ["stage", "backdrop", "meals"],
      "availability": "Setup 9 AM, show 5 PM",
      "qualifications": null,
      "specialInstructions": "Main stage, 500-capacity hall.",
      "notes": null
    }
  }'
```

### `GET /api/requirements/:id`

- `200` → `{ "success": true, "data": { …full document… } }`
- `400` → malformed ID format
- `404` → not found

```bash
curl http://localhost:5000/api/requirements/<id>
```

## Architecture

```
src/
  config/      env.ts (validated env) · db.ts (Mongoose connect)
  controllers/ HTTP layer — Zod parse, status codes, response shapes
  services/    requirement.service.ts — date rules, persistence
  models/      Requirement.ts — Mongoose schema, enums, timestamps, indexes
  validators/  requirement.ts — Zod schemas (source of truth for shape)
  middleware/  error-handler.ts — centralised, client-safe errors
  routes/      /api/health, /api/requirements
  utils/       ApiError, asyncHandler
  app.ts       Express app (CORS, JSON, logging, routes, error handling)
  server.ts    bootstrap: env → db → listen, graceful shutdown
  tests/       vitest validator suite + supertest API suite (in-memory Mongo)
```

Request flow: `routes → controller (Zod safeParse) → service (date rules,
Mongoose) → model`. All errors funnel through the central error handler,
which never leaks stack traces or database details to the client.

## Deployment (Render)

1. New **Web Service**, root directory `backend`.
2. Build: `npm install && npm run build` · Start: `npm start`
   (also encoded in the root `render.yaml`).
3. Add env vars: `MONGODB_URI` (Atlas), `FRONTEND_URL` (your deployed
   frontend), `NODE_ENV=production` (`PORT` is injected by Render).
4. On the frontend (Vercel), set
   `NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com/api`.
