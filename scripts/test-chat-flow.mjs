import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const USER = { userName: "claude_dev_probe2", password: "Test12345!" };
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

await page.goto(`${BASE}/messages`);
await page.waitForSelector("text=Сообщения", { timeout: 5000 });
check("виден заголовок «Сообщения»", (await page.locator("text=Сообщения").count()) > 0);

// Existing chat with probe3 should already be listed (created via curl earlier)
await page.waitForSelector(`text=${OTHER_USERNAME}`, { timeout: 8000 }).catch(() => {});
const hasExistingChat = (await page.locator(`text=${OTHER_USERNAME}`).count()) > 0;
check("существующий чат виден в списке", hasExistingChat);

if (hasExistingChat) {
  await page.click(`text=${OTHER_USERNAME}`);
  await page.waitForURL(/\/messages\/\d+$/, { timeout: 5000 }).catch(() => {});
  check("клик по чату открывает переписку", /\/messages\/\d+$/.test(page.url()));

  const messageText = `Playwright msg ${Date.now()}`;
  await page.fill('input[placeholder="Сообщение…"]', messageText);
  await page.click('button[aria-label="Отправить"]');
  await page.waitForSelector(`text=${messageText}`, { timeout: 5000 }).catch(() => {});
  const bodyAfterSend = await page.textContent("body");
  check("отправленное сообщение появилось в переписке", bodyAfterSend?.includes(messageText));

  // Delete the message we just sent (hover to reveal delete button, then click)
  const bubble = page.locator(`text=${messageText}`).locator("..").locator("..");
  await bubble.hover();
  const deleteBtn = page.locator('button[aria-label="Удалить сообщение"]').first();
  if ((await deleteBtn.count()) > 0) {
    await deleteBtn.click();
    await page.waitForTimeout(1500);
    const bodyAfterDelete = await page.textContent("body");
    check("сообщение удалено", !bodyAfterDelete?.includes(messageText));
  } else {
    check("сообщение удалено", false);
  }
}

// New chat flow via search dialog
await page.goto(`${BASE}/messages`);
await page.waitForTimeout(800);
await page.click('button[aria-label="Новое сообщение"]');
await page.waitForSelector("text=Новое сообщение", { timeout: 5000 });
await page.fill('input[placeholder="Введите имя пользователя"]', "probe1");
await page.waitForTimeout(1200);
const dialogText = await page.textContent("body");
check("поиск в диалоге создания чата находит пользователя", dialogText?.includes("claude_dev_probe1"));

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) {
  console.log("FAILED:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
