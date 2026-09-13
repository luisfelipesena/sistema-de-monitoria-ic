---
name: ponytail
description: >
  Lazy-senior coding and over-engineering hunter (YAGNI, DRY, stdlib/native
  first). Default job: review a PR, branch, or the user's own diff for
  complexity to delete. Also: whole-repo bloat audit, harvest `# ponytail:`
  shortcuts, show the published scoreboard, switch intensity (lite/full/ultra/off),
  pick a native platform feature over a new package. Use when the user says
  ponytail, /ponytail, /ponytail-review, /ponytail-audit, /ponytail-debt,
  /ponytail-gain, /ponytail-help, "review for over-engineering", "is this
  over-engineered", "what can we delete", "simplify this", "DRY", "YAGNI",
  "audit this codebase", "find bloat", "ponytail debt", "what did we defer",
  "ponytail gain", "what does ponytail save", or when reviewing PRs or own
  code for complexity (not correctness). Complements pr-review; this pass
  only hunts complexity. Do not use for non-coding requests.
argument-hint: "[lite|full|ultra|off|review|audit|debt|gain]"
license: MIT
---

# Ponytail

Upstream: [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) @ `2ed6c52` (MIT). Vendored 2026-08-21. Re-diff on a release.

The 7-rung ladder lives in `~/dev-factory/AGENTS.md` (always-on, default **full**). Do not re-inject it. This skill is the intensity switch, the native cheat sheet, and the over-engineering pass.

One skill. Pick the mode from intent. Do not look for `ponytail-review` / `ponytail-audit` / `ponytail-debt` / `ponytail-gain` / `ponytail-help`: they were merged here.

## Pick a mode

Read the request. Do not ask which mode unless two are equally plausible.

| Intent | Mode |
|--------|------|
| PR, branch, own diff, "over-engineered", "what can we delete", DRY, YAGNI, simplify | **review** (default when looking at code) |
| Whole repo, "audit this codebase", find bloat | **audit** |
| `# ponytail:` comments, deferred shortcuts, ledger | **debt** |
| Scoreboard, "what does ponytail save" | **gain** |
| lite / full / ultra / off / "stop ponytail" / "normal mode" | **intensity** |
| Add a picker, dialog, debounce, date format, new npm/pip package | **native** |
| "how do I use ponytail", `/ponytail` with no task | print this table and stop |

Explicit `/ponytail <mode>` wins over inference.

---

## intensity

Default **full**, already active via AGENTS.md. Switch: `/ponytail lite|full|ultra|off` (or "ponytail ultra"). Off lasts this session only unless the user says otherwise. "stop ponytail" / "normal mode" = off for the session.

| Level | What changes |
|-------|--------------|
| **lite** | Build what's asked, name the lazier alternative in one line. User picks. |
| **full** | Ladder enforced. Stdlib and native first. Shortest diff, shortest explanation. Default. |
| **ultra** | YAGNI extremist. Ship the one-liner and challenge the rest of the requirement in the same breath. |

Example: "Add a cache for these API responses."

- lite: "Done, cache added. FYI: `functools.lru_cache` covers this in one line if you'd rather not own a cache class."
- full: "`@lru_cache(maxsize=1000)` on the fetch function. Skipped custom cache class, add when lru_cache measurably falls short."
- ultra: "No cache until a profiler says so. When it does: `@lru_cache`. A hand-rolled TTL cache class is a bug farm with a hit rate."

---

## native

When the task is "add a picker / dialog / debounce / clone / date format / new npm package", read `references/platform-native.md` before writing or installing anything. Stop at the first native or stdlib match.

---

## review

Primary use. Complements `pr-review` (correctness + layering). This pass only hunts complexity.

Review the current diff (or named files) for unnecessary complexity. One line per finding: location, what to cut, what replaces it. The diff's best outcome is getting shorter.

Hunt: reinvented stdlib, unneeded deps, speculative abstractions, dead flexibility, duplicated logic that already lives in this repo.

### Format

`file:L12-38: tag: ...`, or `file:L4: tag: ...`.

Tags:

- `delete:` dead code, unused flexibility, speculative feature. Replacement: nothing.
- `stdlib:` hand-rolled thing the standard library ships. Name the function.
- `native:` dependency or code doing what the platform already does. Name the feature.
- `yagni:` abstraction with one implementation, config nobody sets, layer with one caller.
- `dry:` same logic already in this repo. Name the existing helper and delete the copy.
- `shrink:` same logic, fewer lines. Show the shorter form.

### Examples

Bad: "This EmailValidator class might be more complex than necessary."

Good:

- `validate.py:L12-38: stdlib: 27-line validator class. "@" in email, 1 line, real validation is the confirmation mail.`
- `dates.ts:L4: native: moment.js imported for one format call. Intl.DateTimeFormat, 0 deps.`
- `repo.py:L88: yagni: AbstractRepository with one implementation. Inline it until a second one exists.`
- `retry.py:L52-71: delete: retry wrapper around an idempotent local call. Nothing replaces it.`
- `group.py:L30-44: shrink: manual loop builds dict. dict(zip(keys, values)), 1 line.`
- `dates.ts:L40: dry: formatDate copy. Use lib/date.ts:formatDate.`

### Scoring

End with the only metric that matters: `net: -N lines possible.`

If there is nothing to cut, say `Lean already. Ship.` and stop.

### Boundaries

Scope: over-engineering and complexity only. Correctness bugs, security holes, and performance are out of scope. Route them to a normal review pass (`pr-review`). A single smoke test or assert-based self-check is the ponytail minimum, not bloat; never flag it for deletion. Does not apply the fixes, only lists them.

---

## audit

Same tags, format, scoring, and boundaries as **review**. Scan the whole tree instead of a diff. Rank findings biggest cut first.

Hunt: deps the stdlib or platform already ships, single-implementation interfaces, factories with one product, wrappers that only delegate, files exporting one thing, dead flags and config, hand-rolled stdlib, copy-pasted helpers.

One-shot report. Applies nothing.

---

## debt

Every deliberate ponytail shortcut is marked with a `ponytail:` comment naming its ceiling and upgrade path. Collect them into one ledger so a deferral can't quietly become permanent.

Grep, skipping `node_modules`, `.git`, and build output:

```
rg -nE '(#|//) ?ponytail:' .
```

Each hit is one ledger row. The comment prefix keeps prose that merely mentions the convention out of the ledger.

Output, grouped by file:

`path:L12  ceiling: ...  upgrade: ...`

Convention: `ponytail: <ceiling>, <upgrade when>`. Flag any comment that names no upgrade path or trigger with `no-trigger`; those silently rot.

End with `N markers, M with no trigger.` Nothing found: `No ponytail: debt. Clean ledger.`

Reads and reports only. To persist it, ask and it writes the ledger to a file (e.g. `PONYTAIL-DEBT.md`). One-shot.

This is the only real per-repo figure. Never invent a "you saved X lines here" number; the unbuilt version was never written.

---

## gain

One-shot display. Do not change mode, write flag files, or persist anything.

Figures are the published **agentic** benchmark (12 feature tasks on tiangolo's FastAPI + React template, Haiku 4.5, n=4), not this repo. Source: https://github.com/DietrichGebert/ponytail (README + `benchmarks/results/2026-06-18-agentic.md`). The older single-shot 80-94% LOC cut is a conversational-baseline artifact; do not quote it as the average.

```
  vs no-skill baseline     LOC     tokens   cost    time    safe
  ponytail                 -54%    -22%     -20%    -27%    100%
  caveman (terse prose)    -20%    +7%      +3%     +2%     100%
  "YAGNI + one-liners"     -33%    -14%     -21%    -30%    95%
```

Biggest cuts are over-build traps (date picker 404→23 lines because it uses native `<input type="date">`). Near zero on code that is already minimal. Safety (validation, error handling, security, accessibility) is never simplified away; a bare "write one-liners" prompt dropped one guard, ponytail did not.

NEVER print a per-repo savings number. For this repo's deferred shortcuts, run **debt**. For what's still cuttable, run **audit**.
