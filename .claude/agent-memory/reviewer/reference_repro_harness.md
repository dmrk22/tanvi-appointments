---
name: reference-repro-harness
description: How to prove UI defects in the appointment repo without editing it — scratch Playwright config + ?test=1 seams
metadata:
  type: reference
---

Read-only browser repro for this repo (used 2026-09-23):
- Put a `pw.config.ts` + `*.spec.ts` in the session scratchpad with `testDir: "."`, `outputDir` in the scratchpad, and webServer `npx vite preview --port 4199` with `cwd` = repo. Run from the repo with `NODE_PATH=<repo>/node_modules npx playwright test -c <scratch config>`.
- Specs can import repo sources directly (e.g. `src/lib/ics`, `tests/png` for `testPng()`).
- `?test=1` exposes `window.__setNow(iso)` (shifts `clock.offset` in src/lib/when.ts) plus timeScale 20 and a single-tap hold confirm.
- Before trusting results, check that dist/ mtime matches the HEAD commit time. `vite preview` does not rebuild.

Related: [[project-recurring-defects]]
