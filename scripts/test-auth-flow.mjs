import { chromium } from "playwright";

const BASE = "http://localhost:3000";
// claude_dev_probe1 упёрся в бэкенд-баг (500 на /Account/login после серии
// PUT/DELETE к его профилю в Этапе 3) — используем нетронутый аккаунт.
const USER = { userName: "claude_dev_probe3", password: "Test12345!" };

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

// 1. Unauthenticated access to a protected route redirects to /login
await page.goto(`${BASE}/settings`);
await page.waitForURL(`${BASE}/login`, { timeout: 5000 }).catch(() => {});
check("неавторизованный /settings -> редирект на /login", page.url() === `${BASE}/login`);

// 2. Login flow
await page.goto(`${BASE}/login`);
await page.fill("#userName", USER.userName);
await page.fill("#password", USER.password);
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 8000 }).catch(() => {});
check("логин -> редирект на /", page.url() === `${BASE}/`);

const feedText = await page.textContent("body");
check("после логина видно ленту (не форму входа)", feedText?.includes("Все") && feedText?.includes("Подписки"));

// 3. localStorage has the token
const authStorage = await page.evaluate(() => localStorage.getItem("auth-storage"));
check("токен сохранён в localStorage", !!authStorage && authStorage.includes("accessToken") && !authStorage.includes('"accessToken":null'));

// 4. Protected route now accessible
await page.goto(`${BASE}/settings`);
await page.waitForTimeout(500);
check("после логина /settings доступен", page.url() === `${BASE}/settings`);
const settingsText = await page.textContent("body");
check("настройки показывают имя пользователя", settingsText?.includes(USER.userName));

// 5. Logout
await page.click('button:has-text("Выйти из аккаунта")');
await page.waitForURL(`${BASE}/login`, { timeout: 5000 }).catch(() => {});
check("выход -> редирект на /login", page.url() === `${BASE}/login`);

const authStorageAfterLogout = await page.evaluate(() => localStorage.getItem("auth-storage"));
check("токен удалён из localStorage", !authStorageAfterLogout || authStorageAfterLogout.includes('"accessToken":null'));

// 6. Protected route blocked again after logout
await page.goto(`${BASE}/settings`);
await page.waitForURL(`${BASE}/login`, { timeout: 5000 }).catch(() => {});
check("после выхода /settings снова недоступен", page.url() === `${BASE}/login`);

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) {
  console.log("FAILED:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
