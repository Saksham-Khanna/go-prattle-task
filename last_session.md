# Session notes — review fixes

Updated: 2026-10-20. Nothing was deployed or pushed.

The app now uses one architecture: **Next.js frontend → Express API (`backend/`)
→ MongoDB**. The old Next.js API routes, Drizzle/Neon path and PostgreSQL
instructions have been removed. See `README.md` and `DEPLOYMENT.md` for the
current setup.

## Completed in this pass

- Field-specific validation messages (no raw Zod text) on the client and server.
- Errors clear when the matching field is edited; server `400` field errors are
  mapped back onto the form and its steps.
- Past event dates rejected in both schemas; single-day and multi-day ranges
  supported.
- Strict server-side category validation (Planner / Performer / Crew), including
  rejecting foreign requirement fields alongside valid ones.
- API tests: `201`, `400` invalid/incompatible payloads, `400` malformed
  MongoDB IDs, `404` missing records, health `200`/`503`.
- Request timeout + duplicate-submit ref guard/disabled button retained.
- README, DEPLOYMENT.md, backend README and `.env.example` updated.
- Removed the tracked `.env.local.bak` (contained a Neon credential). The
  credential still exists in git history — rotate it and do not push that file.

## Remaining manual verification

- Run the four-step form against a live Express backend + Atlas database.
- Confirm the deployed Render service health endpoint and CORS with the Vercel
  origin.
- Rotate the old Neon database credential.

## Do not

- Deploy or `git push`.
- Re-introduce PostgreSQL/Neon or Next.js API routes.
