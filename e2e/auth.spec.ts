import { expect, test } from "@playwright/test";

const USER = { userName: "claude_dev_probe3", password: "Test12345!" };

test.describe("Авторизация", () => {
  test("неавторизованный доступ к приватному роуту редиректит на /login", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL("/login");
  });

  test("логин даёт доступ к приватным роутам, выход отзывает его", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#userName", USER.userName);
    await page.fill("#password", USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Все", { exact: true })).toBeVisible();

    await page.goto("/settings");
    await expect(page.getByText(USER.userName)).toBeVisible();

    await page.getByRole("button", { name: "Выйти из аккаунта" }).click();
    await expect(page).toHaveURL("/login");

    await page.goto("/settings");
    await expect(page).toHaveURL("/login");
  });
});
