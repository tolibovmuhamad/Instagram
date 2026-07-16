import { defineConfig, devices } from "@playwright/test";

// Путь к Chromium раньше был захардкожен под домашнюю папку одного разработчика,
// поэтому e2e не запускались ни у кого другого. Теперь по умолчанию используется
// браузер, который ставит сам Playwright (`npx playwright install chromium`), а
// переопределить путь можно через PLAYWRIGHT_CHROMIUM_PATH — если, например,
// скачивание headless-shell на машине тормозит и проще указать локальный Chrome.
const CHROMIUM_EXECUTABLE_PATH = process.env.PLAYWRIGHT_CHROMIUM_PATH;

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
        ...(CHROMIUM_EXECUTABLE_PATH
          ? { launchOptions: { executablePath: CHROMIUM_EXECUTABLE_PATH } }
          : {}),
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
