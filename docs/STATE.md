# State

**Milestone:** Phase 1 — Scaffold (not started). Spec: `.claude/commands/go.md` §8.

**Now:** Scaffold Vite vanilla-ts into the repo root. The root already holds `.claude/`, `docs/`, `.gitignore`, so
`npm create vite@latest .` prompts about a non-empty dir. Scaffold into a temp dir and move the files up, so the app stays at the root instead of `./app`.

**Next:** Install gsap 3.15 plus dev deps, set up strict tsconfig and `base: './'`, add fonts/tokens/favicon, `npm run build` green.

## Phone / human to-do
- (optional) His name + WhatsApp number: run `/go name=<Name> phone=<digits incl. country code>`, or edit `src/config.ts` later. If they're empty, the app says "me"/"him" and WhatsApp opens its contact picker.
- Heads-up: go.md Phase 9 creates a **public** GitHub repo `dmrk22/tanvi-appointments` and publishes to GitHub Pages. If you want it private, say so before Phase 9.

## Setup results (2026-09-23)
node 22.23.2 · npm 10.9.8 · git 2.55.0 · docker 29.7.2 · gh 2.101.0 (logged in) · vercel 59.23.0 (logged in).
No `.env.example`, `.mcp.json`, hooks or notification target in this project, so there was nothing to check for those.
