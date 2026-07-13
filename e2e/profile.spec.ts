import { expect, test } from "@playwright/test";

const USER = { userName: "claude_dev_probe2", password: "Test12345!" };
const OTHER_USER_ID = "1b2f216e-eb71-4f8f-94bc-27947bfceba7"; // claude_dev_probe3
const OTHER_USERNAME = "claude_dev_probe3";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.fill("#userName", USER.userName);
  await page.fill("#password", USER.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/");
});

test.describe("Профиль", () => {
  test("/profile редиректит на профиль текущего пользователя и показывает данные", async ({
    page,
  }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile\/[0-9a-f-]+$/);
    await expect(page.getByText(USER.userName)).toBeVisible();
    await expect(page.getByRole("button", { name: "Редактировать профиль" })).toBeVisible();
  });

  test("редактирование bio сохраняется", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile\/[0-9a-f-]+$/);

    await page.getByRole("button", { name: "Редактировать профиль" }).click();
    await page.waitForSelector("#about");
    const bio = `e2e bio ${Date.now()}`;
    await page.fill("#about", bio);
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.getByText(bio)).toBeVisible();
  });

  test("чужой профиль показывает кнопку подписки, а не редактирование", async ({ page }) => {
    await page.goto(`/profile/${OTHER_USER_ID}`);
    await expect(page.getByText(OTHER_USERNAME)).toBeVisible();
    await expect(page.getByRole("button", { name: "Редактировать профиль" })).toHaveCount(0);

    const followButton = page.getByRole("button", { name: /Подписаться|Отписаться/ });
    const before = await followButton.textContent();
    await followButton.click();
    await expect(followButton).not.toHaveText(before ?? "");
  });
});
