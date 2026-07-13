# Roadmap — Instagram Frontend

Дорожная карта разработки фронтенд-клиента Instagram поверх готового бэкенда
(ASP.NET Core Web API). Разрабатывается **только фронтенд**. Источник истины —
ТЗ (`TZ_Instagram_Frontend (1).md`), выжимка — `CLAUDE.md`.

**Стек:** Next.js (App Router) + TypeScript · Axios · TanStack Query · Zustand ·
Tailwind CSS + shadcn/ui · React Hook Form + Zod · JWT.
Типы API — генерировать из Swagger (`openapi-typescript` / `orval`).

---

## Этап 1 — Инфраструктура ✅

- [x] Инициализация Next.js (App Router) + TypeScript.
- [x] Настройка Tailwind CSS и shadcn/ui.
- [x] ESLint, Prettier.
- [x] Axios-инстанс: разворачивание конверта `{ data, errors, statusCode }`,
      подстановка JWT, единый обработчик ошибок (interceptor + тосты через `sonner`).
- [x] Провайдер TanStack Query (React Query).
- [x] Генерация TS-типов из Swagger.
- [x] Базовая структура проекта (`app/`, `components/`, `features/`, `store/`, `lib/`).

## Этап 2 — Авторизация и аккаунт (`/Account`) ✅

- [x] Экран входа (`POST login` → JWT).
- [x] Экран регистрации (`POST register`).
- [x] Восстановление пароля (`DELETE ForgotPassword`, `DELETE ResetPassword`).
- [x] Смена пароля в настройках (`PUT ChangePassword`).
- [x] Хранение и обновление JWT (обсудить httpOnly cookie vs память + refresh).
- [x] Защищённые (приватные) роуты; корректное удаление токена при выходе.

> ⚠️ Обратить внимание на нестандартные HTTP-глаголы: `DELETE` для
> ForgotPassword/ResetPassword и `PUT` для ChangePassword.

## Этап 3 — Профиль (`/UserProfile`, `/User`) ✅

- [x] Просмотр своего профиля (`GET get-my-profile`).
- [x] Редактирование профиля (`PUT update-user-profile`).
- [x] Загрузка/удаление аватара (`PUT/DELETE …-user-image-profile`),
      кроп через `react-easy-crop`, сжатие `browser-image-compression`.
- [x] Чужой профиль (`GET get-user-profile-by-id`, `GET get-is-follow-…`).
- [x] Сохранённые посты (`GET get-post-favorites`).
- [x] Статистика (посты / подписчики / подписки), вкладки, bio.

> ⚠️ Проверено вживую: `update-user-profile` реально сохраняет только `about` и
> `gender` (int 0/1 на запись, строка на чтение) — firstName/lastName/dob/occupation/
> locationId через API не редактируются, несмотря на модель данных в шапке файла.
> Кнопка «Подписаться/Отписаться» на чужом профиле показывает статус (`isSubscriber`)
> бейджем, но не кликабельна — сама мутация подписки перенесена в Этап 6 как и планировалось.

## Этап 4 — Лента и посты (`/Post`) ✅

- [x] Главная лента (`GET get-posts` / `GET get-following-post`) с infinite scroll
      по `pageNumber/pageSize/totalPage/totalRecord`.
- [x] Страница поста с комментариями (`GET get-post-by-id`).
- [x] Создание поста (`POST add-post`, **multipart/form-data**): кроп 1:1 / 4:5 / 16:9, превью, подпись.
- [x] Лайки (`POST like-post`) — анимация через `framer-motion`.
- [x] Комментарии (`POST add-comment`, `DELETE delete-comment`).
- [x] Просмотры (`POST view-post`), сохранение (`POST add-post-favorite`).
- [x] Удаление поста (`DELETE delete-post`), сетка постов в профиле (используется
      `GET get-posts?UserId=` вместо `get-my-posts` — см. примечание ниже).

> ⚠️ Проверено вживую: категории поста нет вообще — у бэкенда отсутствует
> `/Category`-контроллер, а `add-post` принимает только Title/Content/Images.
> `like-post`/`add-post-favorite` — toggle-эндпоинты (повторный вызов снимает
> лайк/сохранение), отдельного unlike/unfavorite нет. `get-my-posts` возвращает
> сырой массив без стандартного конверта (в отличие от всех остальных
> эндпоинтов) — сетка постов в профиле использует `get-posts?UserId={id}`,
> который отдаёт нормальный пагинированный конверт. `images[]` поста может
> содержать видео (например `.mp4`) — обрабатывается через `isVideoFile()`.

## Этап 5 — Сторис (`/Story`) ✅

- [x] Лента аватарок-сторис над лентой (`GET get-stories`).
- [x] Полноэкранный вьюер с прогресс-баром сегментов, переход клик/свайп.
- [x] Создание сторис (`POST AddStories`, multipart).
- [x] Лайки и просмотры (`POST LikeStory`, `POST add-story-view`).
- [x] `GET get-user-stories/{userId}`, `GET get-my-stories`, `DELETE DeleteStory`.

> ⚠️ Проверено вживую: `get-stories`/`get-user-stories` группируют сторис по
> пользователю прямо на бэкенде (`{userId, userName, userImage, stories: []}`) —
> удобно для ленты аватарок, группировка на фронте не нужна. Scope тот же, что
> у `get-following-post`: я + подписки, поэтому лента сторис почти пуста до
> Этапа 6. `get-stories` тоже отдаёт сырой массив без конверта (как
> `get-my-posts`). `LikeStory` — toggle, но возвращает строку "Liked"/"Disliked",
> а не булево. `GetStoryById` отдаёт другую форму данных, чем списочные
> эндпоинты, — вьюер её не использует, обходится данными из списка.

## Этап 6 — Подписки (`/FollowingRelationShip`) ✅

- [x] Кнопка «Подписаться / Отписаться» в профиле
      (`POST add-following-relation-ship`, `DELETE delete-following-relation-ship`).
- [x] Списки подписчиков и подписок (`GET get-subscribers`, `GET get-subscriptions`)
      — открываются по клику на счётчики в шапке профиля.

> ⚠️ Проверено вживую: модуль на бэкенде **не закомментирован** — работает.
> Ответ `add/delete-following-relation-ship` ненадёжен (`data:false` в обоих
> случаях, `errors` на успехе содержит "success followed"/"success un followed" —
> фильтр в `client.ts` расширен под этот и будущие варианты префикса "success").
> Кнопку «под постом» не делал: у обычного `Post` (в отличие от `Reel`) нет поля
> `isSubscriber`, а тянуть его отдельным запросом на каждую карточку в ленте —
> N+1 не по адресу; статус подписки показывается там, где он и так есть дёшево
> (профиль, Reels).

## Этап 7 — Поиск и Reels ✅

- [x] Поиск пользователей (`GET /User/get-users`) с историей поиска
      (`add/get/delete-search-history(ies)`, `…-user-search-history(ies)`).
- [x] Лента Reels (`GET get-reels`) с infinite scroll.

> ⚠️ Проверено вживую: `Reel` — не `Post` по форме (`images` строкой, не
> массивом, плюс `isSubscriber`), лайк/сохранение переиспользуют те же
> `/Post/like-post`/`add-post-favorite`, что и обычные посты (общий `postId`).
> `get-reels` реально отвечает секундами (~15с при PageSize=6, бэкенд грузит
> полные ветки комментариев на каждый reel) — размер страницы уменьшен до 3.

## Этап 8 — Личные сообщения (`/Chat`) ✅

- [x] Список диалогов (`GET get-chats`).
- [x] Окно переписки (`GET get-chat-by-id`), создание чата (`POST create-chat`).
- [x] Отправка сообщения — текст + файл (`PUT send-message`).
- [x] Удаление сообщения / чата (`DELETE delete-message`, `DELETE delete-chat`).
- [x] Обновление — **через polling** (React Query `refetchInterval`), **не через сокеты**.

> ⚠️ Проверено вживую: `get-chat-by-id` возвращает **список сообщений**, а не
> метаданные чата — имя/аватар собеседника берутся из `get-chats` по `chatId`
> (отдельного эндпоинта деталей чата нет). `delete-message` принимает параметр
> с опечаткой бэкенда `massageId` (не `messageId`) — сохранено как есть.
> `create-chat`/`send-message` возвращают новый id напрямую в `data` (числом).

## Этап 9 — Полировка ✅

- [x] Тёмная/светлая тема (Tailwind + shadcn).
- [x] Анимации (лайк, появление постов, переходы).
- [x] Адаптивность 360px–1920px+: сайдбар (desktop) / tablet / нижний таб-бар (mobile).
- [x] Состояния loading / error / empty на каждом экране.
- [x] A11y: alt у изображений, фокус-стили, клавиатурная навигация в модалках.
- [x] Тесты: Vitest + Testing Library, Playwright (e2e).

> ⚠️ До этого этапа полноценной навигации не было вообще — экраны открывались
> только по прямым URL. Сайдбар/таб-бар — центральная часть этого этапа, не
> просто полировка. Пункта «Уведомления» из UI-ориентиров ТЗ нет: у бэкенда
> нет Notification-контроллера (проверено по живому Swagger — есть только
> Account/Chat/FollowingRelationShip/Location/Post/Story/User/UserProfile).
> Формальные тесты живут в `src/**/__tests__` (Vitest) и `e2e/` (Playwright,
> `npm run test` / `npm run test:e2e`); прежние `scripts/test-*.mjs` оставлены
> как быстрые regression-скрипты для ручной проверки без CI-обвязки.

---

## Критерии приёмки (Definition of Done)

- [x] Все экраны реализованы и адаптивны (desktop / mobile).
- [x] Все эндпоинты из ТЗ подключены, обрабатывают loading / error / empty
      (кроме модулей, которых на бэкенде реально нет — `UserSetting`,
      `Notification` — см. открытые вопросы ниже).
- [x] Авторизация защищает приватные роуты; токен корректно обновляется/удаляется при выходе.
- [x] Нет console-ошибок в production-сборке; ESLint без критических предупреждений.
- [x] Код разбит по фичам; переиспользуемый UI вынесен в `components/ui`.

---

## Открытые вопросы (уточнить с backend-командой)

1. Модуль подписок (`FollowingRelationShip`) — когда включат закомментированные методы?
2. Нужна ли привязка `Location` к посту (сейчас только к `UserProfile`)?
3. Планируется ли realtime (SignalR) для чата/уведомлений, или polling — постоянное решение?
4. Модуль `UserSetting` полностью закомментирован — нужен ли он в MVP?
