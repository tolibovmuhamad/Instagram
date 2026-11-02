# Instagram — веб-клиент

Адаптивный клон Instagram на Next.js поверх готового REST API: лента, сторис, Reels, профили, подписки, личные сообщения, уведомления и прямые эфиры. Делался только фронтенд, бэкенд (ASP.NET Core) писала другая команда.

![Next.js](https://img.shields.io/badge/Next.js-App_Router-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?logo=shadcnui&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?logo=reactquery&logoColor=white)
![LiveKit](https://img.shields.io/badge/LiveKit-WebRTC-1F8CF9)
![Playwright](https://img.shields.io/badge/Playwright-e2e-2EAD33?logo=playwright&logoColor=white)

## Возможности

- **Лента и посты.** Бесконечная прокрутка, лайки, сохранение, комментарии с ответами, создание поста с кадрированием (1:1, 4:5, 16:9) и сжатием фото перед загрузкой.
- **Сторис.** Лента аватарок, полноэкранный просмотр с прогресс-баром, создание сторис, «Близкие друзья».
- **Reels, «Интересное» и поиск** с историей запросов.
- **Профиль.** Свой и чужой, редактирование, аватар, подписчики и подписки, сохранённое.
- **Личные сообщения.** Список диалогов и переписка с отправкой файлов.
- **Уведомления** о лайках, подписках и комментариях.
- **Прямые эфиры.** Трансляция с камеры через LiveKit (WebRTC), комментарии, зрители, заявки «в гости» с одобрением хостом в реальном времени через SignalR.
- **Мультиаккаунт.** До 5 аккаунтов одновременно с мгновенным переключением без повторного входа.
- **Безопасность.** Активные сеансы с возможностью завершить чужие, смена и восстановление пароля, блокировка пользователей.
- **Адаптив** от 360 px: сайдбар на десктопе, нижний таб-бар на телефоне. Светлая и тёмная тема.

## Интересные инженерные решения

- **Обновление токенов без гонок.** Access-токен живёт 15 минут, refresh-токен одноразовый: повторное использование бэкенд считает атакой и завершает все сеансы. Поэтому обновление сделано строго однопоточным — отдельная очередь на каждый аккаунт плюс Web Locks между вкладками браузера. Поведение закреплено тестами.
- **Изоляция аккаунтов.** При переключении аккаунта кэш TanStack Query полностью очищается, чтобы данные прошлого аккаунта не «протекали» на экран.
- **Типы из Swagger.** TypeScript-типы API генерируются из OpenAPI-схемы (`npm run gen:api`), а не пишутся руками.
- **Единый слой API.** Axios-инстанс разворачивает конверт ответа `{ data, errors, statusCode }`, подставляет токен и показывает ошибки сервера тостами. Компоненты работают с данными только через хуки React Query.
- **Опрос вместо сокетов там, где их нет на бэкенде.** Чаты, уведомления и счётчики обновляются через `refetchInterval`, а SignalR используется только там, где сервер реально присылает события.

## Стек

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · TanStack Query · Zustand · Axios · React Hook Form + Zod · LiveKit · SignalR · framer-motion · Vitest · Playwright

## Запуск

```bash
npm install
npm run dev     # http://localhost:3000
```

По умолчанию клиент ходит в боевой API. Другой адрес можно задать переменной `NEXT_PUBLIC_API_URL` в `.env.local`.

> Бэкенд размещён на бесплатном тарифе Render и засыпает после простоя, поэтому первый запрос может занять до минуты.

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | Дев-сервер |
| `npm run build` | Прод-сборка |
| `npm run lint` | ESLint |
| `npm test` | Юнит-тесты (Vitest) |
| `npm run test:e2e` | E2E-тесты (Playwright) |
| `npm run gen:api` | Сгенерировать типы из Swagger |

## Структура

```
src/
  app/          роуты Next.js: (auth) — вход и регистрация, (main) — приложение
  components/   UI-компоненты (shadcn/ui, навигация, посты, сторис, чат)
  features/     доменные модули: auth, posts, stories, reels, chat, live, notifications, …
  store/        Zustand-сторы (авторизация, мультиаккаунт, UI)
  lib/api/      axios-клиент, интерсепторы, типы из Swagger
```

Подробная дорожная карта — в [ROADMAP.md](ROADMAP.md).
