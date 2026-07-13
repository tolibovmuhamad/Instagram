import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const USER = { userName: "claude_dev_probe2", password: "Test12345!" };
const SCRATCH_PNG =
  "C:/Users/XBIT-2~1/AppData/Local/Temp/claude/C--Users-XBIT-2025-Desktop-Instagram/cf094944-f584-432a-b2ef-fefdd522c55f/scratchpad/test.png";

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
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text());
});
page.on("pageerror", (err) => console.log("PAGEERROR:", err.message));

await page.goto(`${BASE}/login`);
await page.fill("#userName", USER.userName);
await page.fill("#password", USER.password);
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 8000 }).catch(() => {});

await page.goto(`${BASE}/profile`);
await page.waitForURL(/\/profile\/[0-9a-f-]+$/, { timeout: 5000 }).catch(() => {});
await page.waitForTimeout(1500);

await page.setInputFiles('input[type="file"]', SCRATCH_PNG);
await page.waitForSelector("text=Новый аватар", { timeout: 5000 });
check("диалог кропа открылся", true);

// react-easy-crop рендерит canvas/reactive area — дадим ему время замерить контейнер
await page.waitForTimeout(1000);

await page.click('button:has-text("Сохранить")');
await page.waitForSelector("text=Аватар обновлён", { timeout: 10000 }).catch(() => {});
const toastVisible = await page.locator("text=Аватар обновлён").count();
check("тост об успешном обновлении аватара показан", toastVisible > 0);

await page.waitForTimeout(500);
const avatarSrc = await page.locator("img[alt='claude_dev_probe2']").first().getAttribute("src").catch(() => null);
check("у аватара появился реальный src (не пустой)", !!avatarSrc && avatarSrc.includes("images"));

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) {
  console.log("FAILED:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
