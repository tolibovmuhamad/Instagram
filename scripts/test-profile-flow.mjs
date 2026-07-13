import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const USER = { userName: "claude_dev_probe2", password: "Test12345!" };
const OTHER_USER_ID = "1b2f216e-eb71-4f8f-94bc-27947bfceba7"; // claude_dev_probe3
const OTHER_USERNAME = "claude_dev_probe3";

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

// Login
await page.goto(`${BASE}/login`);
await page.fill("#userName", USER.userName);
await page.fill("#password", USER.password);
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 8000 }).catch(() => {});

// /profile redirects to /profile/{myId}
await page.goto(`${BASE}/profile`);
await page.waitForURL(/\/profile\/[0-9a-f-]+$/, { timeout: 5000 }).catch(() => {});
check("/profile редиректит на /profile/{myId}", /\/profile\/[0-9a-f-]+$/.test(page.url()));

await page.waitForTimeout(2000);
const bodyText1 = await page.textContent("body");
check("виден username", bodyText1?.includes(USER.userName));
check("видна статистика публикаций", bodyText1?.includes("публикаций"));
check("видна кнопка редактирования", bodyText1?.includes("Редактировать профиль"));
check("виден таб Сохранённое (свой профиль)", bodyText1?.includes("Сохранённое"));
check(
  "виден тестовый пост в сетке",
  (await page.locator("img[alt='Probe2 test post']").count()) > 0,
);

// Edit profile
await page.click('button:has-text("Редактировать профиль")');
await page.waitForSelector("#about", { timeout: 3000 });
await page.fill("#about", "Playwright verified bio");
await page.click('button[type="submit"]:has-text("Сохранить")');
await page.waitForTimeout(1000);
const bodyText2 = await page.textContent("body");
check("bio обновилось после редактирования", bodyText2?.includes("Playwright verified bio"));

// Visit another user's profile
await page.goto(`${BASE}/profile/${OTHER_USER_ID}`);
await page.waitForTimeout(1000);
const bodyText3 = await page.textContent("body");
check("виден чужой username", bodyText3?.includes(OTHER_USERNAME));
check("нет кнопки редактирования на чужом профиле", !bodyText3?.includes("Редактировать профиль"));
check("видна кнопка подписки", bodyText3?.includes("Подписаться") || bodyText3?.includes("Отписаться"));
check("нет таба Сохранённое на чужом профиле", !bodyText3?.includes("Сохранённое"));

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) {
  console.log("FAILED:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
