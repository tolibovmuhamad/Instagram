import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const USER = { userName: "claude_dev_probe2", password: "Test12345!" };

const results = [];
function check(name, condition) {
  results.push({ name, ok: !!condition });
  console.log(`${condition ? "OK " : "FAIL"} ${name}`);
}

const browser = await chromium.launch({
  executablePath:
    "C:/Users/XBIT-2025/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe",
});
const page = await browser.newPage();

await page.goto(`${BASE}/login`);
await page.fill("#userName", USER.userName);
await page.fill("#password", USER.password);
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(1000);

// Mobile (360px per ТЗ minimum)
await page.setViewportSize({ width: 360, height: 800 });
await page.waitForTimeout(300);
check("mobile 360px: боковой сайдбар скрыт", !(await page.locator("nav.md\\:flex").isVisible()));
check(
  "mobile 360px: нижний таб-бар виден",
  await page.locator('nav:has(a[aria-label="Главная"])').isVisible(),
);

// Tablet (768px)
await page.setViewportSize({ width: 800, height: 900 });
await page.waitForTimeout(300);
const sidebarTablet = page.locator("nav.md\\:flex");
check("tablet 800px: сайдбар виден", await sidebarTablet.isVisible());
check(
  "tablet 800px: подписи пунктов скрыты (только иконки)",
  !(await page.locator("nav.md\\:flex >> text=Главная").isVisible()),
);

// Desktop (1440px)
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(300);
check("desktop 1440px: сайдбар виден", await sidebarTablet.isVisible());
check(
  "desktop 1440px: подписи пунктов видны",
  await page.locator("nav.md\\:flex >> text=Главная").isVisible(),
);
check(
  "desktop 1440px: нижний таб-бар скрыт",
  !(await page.locator('a[aria-label="Главная"]').isVisible()),
);

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) {
  console.log("FAILED:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
