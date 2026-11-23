# Security Policy

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.
Report them privately using **GitHub Private Vulnerability Reporting** under the **Security** tab of this repository.

## Production Security Checklist

- Set a strong random `NEXTAUTH_SECRET` (`openssl rand -base64 32`) and `CRON_SECRET` (`openssl rand -hex 32`).
- Set `SEED_ADMIN_EMAIL` and a strong `SEED_ADMIN_PASSWORD` before running `npm run db:seed`.
- Serve behind HTTPS so OAuth cookies (`x_oauth_state`, `x_code_verifier`) and NextAuth session cookies use the `Secure` flag.
- Protect all `/api/cron/*` endpoints with `x-cron-secret` or `Authorization: Bearer <CRON_SECRET>`.
