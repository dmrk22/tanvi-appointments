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

## 2026-09-23 — Phase 1

- **TypeScript ~6.0.2, not 7.0.2**: the Vite 8 vanilla-ts template pins `~6.0.2`; kept the pairing the template is tested with. `tsc --noEmit` + `strict` as the spec requires.
- Scaffolded in a scratch dir and copied only config up (root isn't empty); template boilerplate (counter.ts, assets, icons.svg) never entered the repo.

## 2026-09-23 — Post-Phase-7 reviewer pass

- Dispatched the `reviewer` subagent against the full diff before shipping. It reproduced 5 real defects
  in a live Chromium build (not a synthetic harness) and found 1 test-process gap. All fixed, each with a
  regression test that was proven to fail on the pre-fix code and pass on the post-fix code:
  1. **Edit-from-pass skipped re-validation**: changing the date on the review pass could null out the
     time (or leave a since-passed slot) and still let the booking confirm, breaking Send/ics/history.
     Fixed by extracting `firstInvalidStep()` into `src/steps/list.ts` (a new module that both
     `wizard.ts` and `review.ts` can import without a circular dependency) and checking it both when
     "Back to pass" is pressed and at the hold-to-confirm moment.
  2. **Garden flowers stopped swaying once you left Hello.** `garden.start()` runs inside a scene's
     `enter()`, so gsap's Context auto-captured the flowers' infinite sway tweens under that scene and
     killed them on the next scene change. Fixed with `Context#ignore` in `flowers.ts` so every flower's
     tweens live outside any scene's context, for the life of the garden.
  3. **The router could mount two scenes at once** (e.g. two fast keyboard Enters on "Book another"),
     leaking the first scene's tweens and listeners. Fixed with a `swapping` guard in `router.ts`.
  4. **A delayed `title.focus()` (0.4s) in the wizard raced a fast Tab press**, made the "keyboard alone"
     e2e test flake (4/8 under `--repeat-each=8`). Fixed by focusing synchronously in `goTo()` instead —
     the card is already in the DOM by then, so the delay was never needed. 10/10 under repeat-each=10.
  5. **`.replace(/;/g, "\;")` in `lib/ics.ts` was a no-op** (`"\;"` is just `";"` in a JS string literal),
     so `.ics` `DESCRIPTION`/`LOCATION` semicolons were never actually escaped per RFC 5545. Fixed to
     `"\;"`, with a unit test proving the pre-fix string was a false escape.
  - Also fixed two low-severity object-URL leaks on decode-failure paths (`image.ts`, `ticketPng.ts`),
    and made `playwright.config.ts`'s webServer always rebuild (`reuseExistingServer: false`) instead of
    risking a stale `dist/` behind a reused preview server.
- Full suite: 15/15 across phone/small-phone/desktop/reduced-motion, plus phone re-run at `--repeat-each=3`
  (36/36) for flake confidence. Bundle budget unaffected (68.72 KB JS gz, 5.74 KB CSS gz).
