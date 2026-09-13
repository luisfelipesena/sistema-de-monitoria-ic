# Cursor Cloud

This clone is what the **Monitoria IC** Project boots. Do not restore a dashboard snapshot id
in `.cursor/environment.json` (that is what broke env `53a96350-…`).

- `npm ci` then `npm run dev` (Next on :3000). Postgres via `docker compose up -d db` (port 5435).
- CAS/Dokku/MinIO are campus infra. They are not on this VM. Do not add `minio-dokku`.
- Skills in `.cursor/skills/`. Keep **Sync Skills for Cloud Agents** off.

See `cursor-cloud`.
