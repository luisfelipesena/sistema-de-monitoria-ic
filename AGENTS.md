# Cursor Cloud

This clone is what the **Monitoria IC** Project boots. Do not restore a dashboard snapshot id
in `.cursor/environment.json` (that is what broke env `53a96350-…`).

- `npm ci` then `npm run dev` (Next on :3000). Postgres via `docker compose up -d db` (port 5435).
- Dokku deploy (`./deploy.sh`) needs Runtime Secret `DOKKU_SSH_PRIVATE_KEY` (the Mac file `~/.ssh/dokku`). Host `app.ic.ufba.br:9999`.
- CAS/MinIO stay campus infra. Do not add `minio-dokku`.
- Skills in `.cursor/skills/`. Keep **Sync Skills for Cloud Agents** off.

See `cursor-cloud`.
