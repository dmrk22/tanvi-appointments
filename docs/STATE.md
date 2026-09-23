# State

**Milestone:** Done. All 9 phases of `.claude/commands/go.md` complete and shipped.

**Now:** Live at https://dmrk22.github.io/tanvi-appointments/ (GitHub Pages, `gh-pages` branch, auto-deployed
via `npx gh-pages -d dist`). Verified in a real headless Chromium load against the live URL: Hello scene,
boot->hello transition, and the full booking wizard (calendar step confirmed working) with zero console
errors. Source is on `master` at `github.com/dmrk22/tanvi-appointments`.

**Next:** Nothing required. Optional: set his name + WhatsApp number in `src/config.ts`
(`myName`, `myWhatsApp`), then `npm run build && npx gh-pages -d dist` to redeploy.

## Phone / human to-do
- None. To update the site later: edit `src/config.ts`, `npm run build`, `npx gh-pages -d dist`.
