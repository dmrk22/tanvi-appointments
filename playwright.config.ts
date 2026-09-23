import { defineConfig } from "@playwright/test";

const e2e = /end to end/;

export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  use: { baseURL: "http://localhost:4174", browserName: "chromium" },
  // always rebuild first: a reused preview server on a stale dist/ has tested the wrong code before
  webServer: { command: "npm run build && npx vite preview --port 4174 --strictPort", url: "http://localhost:4174", reuseExistingServer: false, timeout: 60_000 },
  projects: [
    { name: "phone", use: { viewport: { width: 390, height: 844 } } },
    { name: "small-phone", grep: e2e, use: { viewport: { width: 360, height: 740 } } },
    { name: "desktop", grep: e2e, use: { viewport: { width: 1440, height: 900 } } },
    { name: "reduced-motion", grep: e2e, use: { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" } },
  ],
});
