import { defineConfig, devices } from "@playwright/test";

const CHROMIUM_EXECUTABLE_PATH =
  "C:/Users/XBIT-2025/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Headless chromium-headless-shell download is slow/flaky on this machine —
        // reuse the already-installed full Chromium binary instead (see project memory).
        launchOptions: { executablePath: CHROMIUM_EXECUTABLE_PATH },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
