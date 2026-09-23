# Decisions

## 2026-09-23 — /setup

- **frontend-design skill**: `.claude/skills/frontend-design/{SKILL.md,LICENSE.txt}` fetched from
  github.com/anthropics/skills `skills/frontend-design` at commit `34040c9c568585f6929bedeaad110ad08f079624`.
- **Pinned versions** (`npm view <pkg> version`, 2026-09-23), for the packages `.claude/commands/go.md` names:

  | package | version | spec requirement |
  |---|---|---|
  | gsap | 3.15.0 | ≥ 3.13 (only runtime dep) |
  | vite | 8.3.0 | via `npm create vite` |
  | typescript | 7.0.2 | strict; `tsc --noEmit` in build |
  | @playwright/test | 1.63.0 | dev dep |
  | gh-pages | 6.3.0 | Phase 9 deploy via npx |

- **No remote created at setup**: `$GITHUB_REPO` is unset and go.md Phase 9 creates the public repo
  `tanvi-appointments` itself. Bootstrap is committed locally only.
- **Deploy target**: GitHub Pages (go.md Phase 9 route 1). `gh` is logged in as `dmrk22` with `repo` scope;
  Vercel CLI 59.23.0 is also logged in as `damaruk` (route 2 fallback). No Railway/DB — the app is static, no backend.
- `files/` and `files.zip` are the original delivery copies of `.claude/`; `diff` shows they're identical, so they're gitignored and not deleted.
