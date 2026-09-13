---
name: cursor-cloud
description: >
  Map Cursor Cloud / Projects VMs to Mac and Hetzner. Use when running inside a
  Cursor Project, Cloud Agent, or when the user asks for lid-closed / mobile
  work, skill sync, MCP on cloud, or whether the Hetzner box can be cancelled.
---

# Cursor Cloud vs Mac vs Hetzner

This VM is Ubuntu. It is not the Mac and it is not `devbox`.

| Host | What it is | Skills / MCP that work |
|---|---|---|
| **Cursor Cloud** (this VM) | Isolated Ubuntu. Repos + dashboard secrets. | Repo `.cursor/skills/`. HTTP MCPs (Figma, Atlassian, GitHub, Stripe). EAS/Vercel/surge if secrets exist. |
| **Mac** | Simulator, Xcode, Chrome MetaCTO, `exui` tunnel, cua-driver | `/ios-dev` Simulator/Maestro, `/mac-computer-use`, Figma OAuth in Chrome MetaCTO |
| **Hetzner `devbox`** | 16GB, Docker/MySQL, Executor, Herdr, ticket worktrees | `/claude-tui-orchestrator`, `/ticket-dev`, `exui`, `settings_private.py`, AWS SSO |

## Do not do on this VM

- `ssh devbox`, `exui`, `executor-box-mcp`, `herdr agent start`
- Xcode, Simulator, Maestro iOS, `asc auth login` into Keychain
- Dump `~/.secrets` into git. Secrets come from the Cloud Agents Secrets tab, environment-scoped
- `settings_private.py` or NINJIO prod credentials in the snapshot

## `/claude-tui-orchestrator` here

Do not start Herdr. The Project follow-up **is** the worker. Ticket implementation that needs Docker/Executor still belongs on `devbox` (`dfx worktree-new` + `control.py start`).

## MCP

Cloud has no SSH to Hetzner, so Executor stdio is absent. Use HTTP plugins authed on this environment: NINJIO = Atlassian + Figma + AWS docs. Dividee = GitHub + Stripe + RevenueCat + PostHog + Vercel + Supabase.

Figma Authenticate: Chrome **MetaCTO** as `lsena@ninjio.com`, not a random profile.

## Skills sync toggle

Keep **Sync Skills for Cloud Agents** off. `~/.cursor/skills` is ~180 mixed work+personal skills. This repo pack is the isolation. Cloud discovers `.cursor/skills/` in the git clone.

## Can Hetzner go away?

No, not while NINJIO daily work needs ticket worktrees, nemo Docker, Executor, and Herdr. Cloud covers lid-closed review/follow-up and personal GitHub deploys (surge, EAS, Vercel) once secrets are on that environment.
