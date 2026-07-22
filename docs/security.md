# Security Notes

## Controls

- Secrets are kept out of Git through `.gitignore` and local `.env.local`.
- `scripts/check-secrets.mjs` scans tracked files for common token formats.
- GitHub Actions runs dependency audit and secret-pattern checks.
- CodeQL scans JavaScript and TypeScript on pushes, pull requests, and schedule.
- API routes emit trace IDs and structured response envelopes.
- Monitoring routes include rate limiting, API-key guard support, RBAC simulation, and audit logs.
- The Vercel Cron heartbeat route requires `Authorization: Bearer <CRON_SECRET>`.

## Boundaries

- Supabase service-role keys are server-only.
- Vercel API tokens are stored as Vercel and GitHub secrets, not source files.
- `CRON_SECRET` is stored as a Vercel environment variable, not source code.
- Public dashboard mode avoids privileged write actions.

## Remaining Production Hardening

- Rotate tokens that were ever pasted into chat or local setup logs.
- Replace simulated RBAC with an identity provider before private use.
- Add signed operational actions before exposing acknowledge, rollback, or deploy controls.
- Add managed secret scanning and branch protection in GitHub repository settings.
