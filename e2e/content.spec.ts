import path from "node:path";
import { expect, test } from "@playwright/test";

const USER = { userName: "claude_dev_probe2", password: "Test12345!" };
const TEST_IMAGE = path.join(__dirname, "fixtures", "test-image.png");

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.fill("#userName", USER.userName);
  await page.fill("#password", USER.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/");
});

test.describe("Лента и посты", () => {
  test("лайк и сохранение поста переключают состояние", async ({ page }) => {
    await page.waitForSelector("article");
    const article = page.locator("article").first();

    const likeButton = article.getByRole("button", { name: /Поставить лайк|Убрать лайк/ });
    const likeBefore = await likeButton.getAttribute("aria-label");
    await likeButton.click();
    await expect(likeButton).not.toHaveAttribute("aria-label", likeBefore ?? "");

    const saveButton = article.getByRole("button", { name: /Сохранить|Убрать из сохранённого/ });
    const saveBefore = await saveButton.getAttribute("aria-label");
    await saveButton.click();
    await expect(saveButton).not.toHaveAttribute("aria-label", saveBefore ?? "");
  });

  test("создание поста, комментирование и удаление — полный цикл", async ({ page }) => {
    await page.goto("/create");
    await page.setInputFiles("#post-images", TEST_IMAGE);
    await page.waitForSelector("text=Кадрирование 1 из 1");
    await page.getByRole("button", { name: "Далее" }).click();
    await page.waitForSelector("text=Подпись к публикации");

    const caption = `e2e post ${Date.now()}`;
    await page.fill("#content", caption);
    await page.getByRole("button", { name: "Опубликовать", exact: true }).click();
    // Кроп + сжатие + мультипарт-загрузка — реально может занять больше стандартных 5с.
    await expect(page).toHaveURL(/\/post\/\d+$/, { timeout: 20_000 });
    await expect(page.getByText(caption)).toBeVisible();

    // Комментарий уходит на сервер и сохраняется (add-comment отвечает 200) — признаком
    // успеха считаем очистку поля ввода. Проверить, что он ПОЯВИЛСЯ В СПИСКЕ, здесь нельзя:
    // список комментариев API не отдаёт, см. отдельный test.fixme ниже.
    const commentInput = page.getByLabel("Добавить комментарий");
    await commentInput.fill(`e2e comment ${Date.now()}`);
    await page.getByRole("button", { name: "Опубликовать" }).click();
    await expect(commentInput).toHaveValue("");

    await page.getByRole("button", { name: "Меню поста" }).click();
    await page.getByText("Удалить").click();
    await expect(page).toHaveURL("/");
  });

  // Блокировано бэкендом: в API нет эндпоинта, отдающего корневые комментарии поста
  // (есть только get-comment-replies по id конкретного комментария). Тест начнёт проходить
  // сам, как только появится GET /Post/get-comments — см. ROADMAP, «Не сделано».
  test.fixme("добавленный комментарий виден в списке комментариев", async ({ page }) => {
    await page.goto("/create");
    await page.setInputFiles("#post-images", TEST_IMAGE);
    await page.waitForSelector("text=Кадрирование 1 из 1");
    await page.getByRole("button", { name: "Далее" }).click();
    await page.waitForSelector("text=Подпись к публикации");

    await page.fill("#content", `e2e post ${Date.now()}`);
    await page.getByRole("button", { name: "Опубликовать", exact: true }).click();
    await expect(page).toHaveURL(/\/post\/\d+$/, { timeout: 20_000 });

    const comment = `e2e comment ${Date.now()}`;
    await page.getByLabel("Добавить комментарий").fill(comment);
    await page.getByRole("button", { name: "Опубликовать" }).click();
    await expect(page.getByText(comment)).toBeVisible();

    await page.getByRole("button", { name: "Меню поста" }).click();
    await page.getByText("Удалить").click();
  });
});
