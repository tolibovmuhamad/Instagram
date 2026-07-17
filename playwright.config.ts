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
  // Один воркер: все тесты ходят в ОДИН общий бэкенд под одними учётками, параллелить
  // тут нечего — только добавляет нагрузку на него.
  workers: 1,
  retries: 0,
  reporter: "list",
  // Дефолтные 5 с рассчитаны на локальный сервер, а мы ходим в Render (free tier): он
  // засыпает после ~15 минут простоя, и первый запрос ждёт секундами — замерено
  // 17.07.2026: логин после простоя занял 8.7 с. Из-за этого тесты «плавающе» падали на
  // ожидании редиректа после логина, хотя приложение исправно. Ждём дольше.
  expect: { timeout: 20_000 },
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
