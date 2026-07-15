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
    await expect(page.getByText("Для вас", { exact: true })).toBeVisible();

    // Ник на странице настроек не выводится (это меню разделов + форма смены пароля),
    // поэтому признак доступа к приватному роуту — что нас не увело на /login и экран
    // отрисовался. Что залогинены именно под этим пользователем, проверяет profile.spec.
    await page.goto("/settings");
    await expect(page).toHaveURL("/settings");
    await expect(page.getByRole("heading", { name: "Настройки" })).toBeVisible();

    // Выход живёт в меню «Ещё» узкого рейла навигации (редизайн 2026), а не отдельной
    // кнопкой на странице.
    await page.getByRole("button", { name: "Ещё" }).click();
    await page.getByRole("menuitem", { name: "Выйти" }).click();
    await expect(page).toHaveURL("/login");

    await page.goto("/settings");
    await expect(page).toHaveURL("/login");
  });
});
