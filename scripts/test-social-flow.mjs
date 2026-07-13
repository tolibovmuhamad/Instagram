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
page.on("pageerror", (err) => console.log("PAGEERROR:", err.message));

await page.goto(`${BASE}/login`);
await page.fill("#userName", USER.userName);
await page.fill("#password", USER.password);
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(1000);

// --- Этап 6: подписки ---
await page.goto(`${BASE}/profile/${OTHER_USER_ID}`);
await page.waitForTimeout(1200);

const followButton = page.locator('button:has-text("Подписаться"), button:has-text("Отписаться")').first();
const labelBefore = await followButton.textContent();
await followButton.click();
await page.waitForTimeout(800);
const labelAfter = await followButton.textContent();
check("кнопка подписки переключает текст", labelBefore?.trim() !== labelAfter?.trim());

// Leftover state from earlier manual API testing may mean we just unfollowed instead of
// followed — force the end state to "followed" so the subscriptions-list check below is reliable.
if (labelAfter?.trim() === "Подписаться") {
  await followButton.click();
  await page.waitForTimeout(800);
}

// Open subscribers/subscriptions list on my own profile after following
await page.goto(`${BASE}/profile`);
await page.waitForURL(/\/profile\/[0-9a-f-]+$/, { timeout: 5000 }).catch(() => {});
await page.waitForTimeout(1000);
await page.click('button:has-text("подписок")');
await page.waitForSelector("text=Подписки", { timeout: 5000 });
await page
  .waitForSelector(`text=${OTHER_USERNAME}`, { timeout: 5000 })
  .catch(() => {});
const dialogText = await page.textContent("body");
check("в модалке подписок виден нужный пользователь", dialogText?.includes(OTHER_USERNAME));
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

// --- Этап 7: поиск ---
await page.goto(`${BASE}/explore`);
await page.waitForTimeout(500);
await page.fill('input[placeholder="Поиск"]', "probe3");
await page.waitForSelector(`text=${OTHER_USERNAME}`, { timeout: 5000 }).catch(() => {});
const searchText = await page.textContent("body");
check("поиск находит пользователя", searchText?.includes(OTHER_USERNAME));

await page.click(`text=${OTHER_USERNAME}`);
await page.waitForURL(new RegExp(`/profile/${OTHER_USER_ID}`), { timeout: 5000 }).catch(() => {});
check("клик по результату поиска ведёт в профиль", page.url().includes(OTHER_USER_ID));

await page.goto(`${BASE}/explore`);
await page.waitForTimeout(800);
const historyText = await page.textContent("body");
check("после визита в профиль он появился в истории поиска", historyText?.includes(OTHER_USERNAME));

// --- Этап 7: Reels ---
// /Post/get-reels реально отвечает ~15с на этом бэкенде (тяжёлая выгрузка комментариев
// на каждый reel) — даём щедрый таймаут вместо фиксированной паузы.
await page.goto(`${BASE}/reels`);
await page.waitForSelector("video", { timeout: 30000 }).catch(() => {});
const reelVideos = await page.locator("video").count();
check("лента Reels отображает видео", reelVideos > 0);

const reelLikeButton = page
  .locator('button[aria-label="Поставить лайк"], button[aria-label="Убрать лайк"]')
  .first();
if ((await reelLikeButton.count()) > 0) {
  const reelLikeBefore = await reelLikeButton.getAttribute("aria-label");
  await reelLikeButton.click();
  await page.waitForTimeout(400);
  const reelLikeAfter = await reelLikeButton.getAttribute("aria-label");
  check("лайк в Reels переключает состояние", reelLikeBefore !== reelLikeAfter);
} else {
  check("лайк в Reels переключает состояние", false);
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) {
  console.log("FAILED:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
