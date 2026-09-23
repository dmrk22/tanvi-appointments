import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  use: { baseURL: "http://localhost:4174", viewport: { width: 390, height: 844 }, browserName: "chromium" },
  webServer: { command: "npx vite preview --port 4174 --strictPort", url: "http://localhost:4174", reuseExistingServer: true },
});
