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

// Login
await page.goto(`${BASE}/login`);
await page.fill("#userName", USER.userName);
await page.fill("#password", USER.password);
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 8000 }).catch(() => {});
await page.waitForSelector("article", { timeout: 8000 }).catch(() => {});

check("лента отображает вкладки", (await page.locator("text=Все").count()) > 0);
const feedArticles = await page.locator("article").count();
check("в общей ленте есть посты", feedArticles > 0);

// Like the first post and verify heart fills
const firstHeart = page.locator("article").first().locator('button[aria-label="Поставить лайк"], button[aria-label="Убрать лайк"]').first();
const likeLabelBefore = await firstHeart.getAttribute("aria-label");
await firstHeart.click();
await page.waitForTimeout(300);
const likeLabelAfter = await firstHeart.getAttribute("aria-label");
check("лайк переключает состояние", likeLabelBefore !== likeLabelAfter);

// Save/favorite toggle on first post
const firstSave = page.locator("article").first().locator('button[aria-label="Сохранить"], button[aria-label="Убрать из сохранённого"]').first();
const saveLabelBefore = await firstSave.getAttribute("aria-label");
await firstSave.click();
await page.waitForTimeout(300);
const saveLabelAfter = await firstSave.getAttribute("aria-label");
check("сохранение переключает состояние", saveLabelBefore !== saveLabelAfter);

// Create a new post end-to-end
await page.goto(`${BASE}/create`);
await page.waitForSelector("text=Новая публикация", { timeout: 5000 });
await page.setInputFiles("#post-images", TEST_PNG);
await page.waitForSelector("text=Кадрирование 1 из 1", { timeout: 5000 });
await page.waitForTimeout(800);
await page.click('button:has-text("Далее")');
await page.waitForSelector("text=Подпись к публикации", { timeout: 5000 });
const caption = `Playwright post ${Date.now()}`;
await page.fill("#content", caption);
await page.click('button[type="submit"]:has-text("Опубликовать")');
await page.waitForURL(/\/post\/\d+$/, { timeout: 15000 }).catch(() => {});
check("после публикации редирект на страницу поста", /\/post\/\d+$/.test(page.url()));
await page.waitForTimeout(1000);
const postDetailText = await page.textContent("body");
check("на странице поста видна подпись", postDetailText?.includes(caption));

// Add a comment
const commentText = `Playwright comment ${Date.now()}`;
await page.fill('input[placeholder="Добавьте комментарий…"]', commentText);
await page.click('button:has-text("Опубликовать")');
await page.waitForTimeout(1000);
const afterComment = await page.textContent("body");
check("комментарий появился на странице поста", afterComment?.includes(commentText));

// Delete own post via dropdown menu
await page.click('button[aria-label="Меню поста"]');
await page.waitForTimeout(300);
await page.click("text=Удалить");
await page.waitForURL(`${BASE}/`, { timeout: 8000 }).catch(() => {});
check("после удаления редирект в ленту", page.url() === `${BASE}/`);
await page.waitForTimeout(500);
const toastText = await page.textContent("body");
check("тост об удалении поста показан", toastText?.includes("Пост удалён"));

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) {
  console.log("FAILED:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
