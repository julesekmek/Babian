## 2024-05-24 - Unprotected Administrative Endpoint
**Vulnerability:** The `/api/market/cycle` endpoint allowed unauthenticated POST requests to trigger market cycle processing.
**Learning:** Next.js Route Handlers using `SUPABASE_SERVICE_ROLE_KEY` bypass RLS and are public by default. Relying on obscurity or external triggers without shared secrets leaves critical business logic exposed.
**Prevention:** Always implement an authorization check (e.g., verifying a `CRON_SECRET` header) at the beginning of any API route handler that performs state mutations or administrative tasks.
