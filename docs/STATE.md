# State

**Milestone:** Phase 9 — Ship (blocked on one permission). Spec: `.claude/commands/go.md` §8.

**Now:** Everything through Phase 8 is done and committed (`git log`, HEAD `9279e69`). `npm run build` is
green, budget is well under limits, and the full Playwright suite passes (15/15 across
phone/small-phone/desktop/reduced-motion, 36/36 phone re-run at `--repeat-each=3`).

Phase 9 needs to create a **public** surface (a GitHub repo or a production Vercel deployment), and this
session's auto-mode classifier denies that from the Bash tool ("Create Public Surface"). Both `gh` and
`vercel` are already logged in (`dmrk22` / `damaruk`), so either of these one-liners finishes the ship —
run whichever you prefer from the repo root:

```
# Route 1 — GitHub Pages
gh repo create tanvi-appointments --public --source=. --remote=origin --push
npm run build && npx gh-pages -d dist
gh api repos/dmrk22/tanvi-appointments/pages -X POST -f 'source[branch]=gh-pages' -f 'source[path]=/'
# -> https://dmrk22.github.io/tanvi-appointments/

# Route 2 — Vercel
npm run build && npx vercel deploy --prod dist
```

In the meantime: `tanvi-appointments-dist.zip` at the repo root has the built site, and
`npx vite preview --host --port 4321` is running in the background (Local: http://localhost:4321/,
Network: http://10.4.84.53:4321/) so it can be opened on a phone on the same Wi-Fi right now.

**Next:** After either deploy command above, nothing else — the app is finished.

## Phone / human to-do
- Run one of the two deploy one-liners above (or say "allow public repo creation" and I'll run it).
- (optional) His name + WhatsApp number: edit `src/config.ts` (`myName`, `myWhatsApp`), then
  `npm run build` and redeploy with the same command you used above.
