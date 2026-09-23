---
name: project-recurring-defects
description: Defect classes found in the appointment (Tanvi) gift site review of 2026-09-23 — check these first in any later diff
metadata:
  type: project
---

Defect classes proven in the 2026-09-23 review of 55247bb..cd32f87 (all reproduced in Chromium against dist/):

1. **Edit-jump skips re-validation.** Wizard "Back to pass" (editing flag) jumps straight to Review; the date step nulls `time` when the new date makes it past; confirm only re-checked the photo -> booking with `time: null` -> Send/ics/history sheet crash (history persists in localStorage).
2. **gsap Context captures global-layer tweens.** Anything a scene's `enter` calls (e.g. `garden.start()`) is recorded in the scene ctx and reverted on scene change. gsap 3.15 tween callbacks also run inside their creation ctx, and `Context.add` nests into the active ctx, so the fix is `Context#ignore`, not a separate context.
3. **Router has no in-flight guard.** Two `show()` calls during a wipe mount two scenes; the first ctx never reverts. Mouse is blocked by the `.wipe` overlay; keyboard Enter x2 is not.
4. **Delayed `title.focus()` (0.4s) steals focus.** Made the "keyboard alone" e2e test flaky (4/8 failed at HEAD) even though PROGRESS.md claimed all tests green.
5. **`npm test` runs against a stale `dist/`.** Playwright's webServer is `vite preview` with no build step.
6. Useless JS escapes in string literals (`"\;"` is `";"`) in ics escaping.

**Why:** the author reports "N/N tests green" from a single run. Flakes and stale builds hid real failures.
**How to apply:** always re-run the suite with `--repeat-each` on anything focus- or timing-related, and check dist freshness against HEAD. See [[reference-repro-harness]].
