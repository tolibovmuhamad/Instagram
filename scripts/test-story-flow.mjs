import path from "node:path";
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const USER = { userName: "claude_dev_probe2", password: "Test12345!" };
const TEST_PNG = path.resolve(
  "C:/Users/XBIT-2~1/AppData/Local/Temp/claude/C--Users-XBIT-2025-Desktop-Instagram/cf094944-f584-432a-b2ef-fefdd522c55f/scratchpad/test.png",
);

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
await page.waitForTimeout(1500);

check("своя лента сторис видна ('Вы')", (await page.locator("text=Вы").count()) > 0);

// Create a story
await page.click('button[aria-label="Добавить сторис"]');
await page.setInputFiles('input[type="file"][accept="image/*"]', TEST_PNG);
await page.waitForSelector("text=Новая сторис", { timeout: 5000 });
await page.click('button:has-text("Опубликовать")');
await page.waitForSelector("text=Сторис опубликована", { timeout: 10000 }).catch(() => {});
check("тост о публикации сторис показан", (await page.locator("text=Сторис опубликована").count()) > 0);
await page.waitForTimeout(1000);

// Open own story viewer
const ownBubble = page.locator('button:has(img[alt="Ваша сторис"])').first();
await ownBubble.click();
await page.waitForTimeout(500);
check("вьюер открылся (виден крестик закрытия)", (await page.locator('button[aria-label="Закрыть"]').count()) > 0);
check("прогресс-бар сегментов виден", (await page.locator(".bg-white\\/30").count()) > 0);

// Like the story
const likeButton = page.locator('button[aria-label="Поставить лайк"], button[aria-label="Убрать лайк"]').first();
const likeBefore = await likeButton.getAttribute("aria-label");
await likeButton.click();
await page.waitForTimeout(300);
const likeAfter = await likeButton.getAttribute("aria-label");
check("лайк сторис переключает состояние", likeBefore !== likeAfter);

// Delete the story
await page.click('button[aria-label="Удалить сторис"]');
await page.waitForSelector("text=Сторис удалена", { timeout: 5000 }).catch(() => {});
check("тост об удалении сторис показан", (await page.locator("text=Сторис удалена").count()) > 0);
await page.waitForTimeout(1000);

// Viewer should be closed and story gone from rail (own bubble no longer opens viewer directly)
check("вьюер закрылся после удаления", (await page.locator('button[aria-label="Закрыть"]').count()) === 0);

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) {
  console.log("FAILED:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
