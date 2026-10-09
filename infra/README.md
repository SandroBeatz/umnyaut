# infra

Prod runs on a CIS VPS: Caddy → blue/green Next.js containers. See `docs/deploy/environments-and-ci.md`.

| File | Purpose |
|---|---|
| `bootstrap.sh` | One-time server provisioning (run as root) |
| `compose.yml` | `caddy` + `web-blue` / `web-green` slots |
| `Caddyfile` | TLS, zstd/gzip, `www` → apex, security headers, IP-masked logs, upstream from `state/upstream.caddy` |
| `deploy.sh` | `deploy <tag>` · `rollback` · `status` |
| `server.env.example` | `/srv/umnyaut/.env` for compose (`DOMAIN`, `ACME_EMAIL`) |

App secrets go to `/srv/umnyaut/web.env` (names in the root `.env.example`, `APP_ENV=production`), mode 600.

Rollback: `ssh deploy@<host> /srv/umnyaut/deploy.sh rollback` or run the **Deploy** workflow manually with `rollback: true`.
