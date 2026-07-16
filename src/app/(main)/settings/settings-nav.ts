import {
  Accessibility,
  AtSign,
  BadgeCheck,
  Ban,
  Bell,
  BellOff,
  CaseSensitive,
  ChartColumn,
  CircleSlash2,
  CircleUserRound,
  Crown,
  Download,
  HeartOff,
  History,
  House,
  Images,
  Languages,
  LifeBuoy,
  Lock,
  MessageCircle,
  Monitor,
  MonitorSmartphone,
  Repeat2,
  Send,
  ShieldCheck,
  Star,
  User,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SettingsItem {
  id: string;
  label: string;
  icon: LucideIcon;
  subtitle?: string;
}

export interface SettingsSection {
  title?: string;
  /** Показать логотип Meta справа от заголовка секции. */
  metaLogo?: boolean;
  items: SettingsItem[];
}

// Разделы повторяют настройки веб-версии Instagram 2026.
export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: "Ваш аккаунт",
    metaLogo: true,
    items: [
      {
        id: "accounts-center",
        label: "Центр аккаунтов",
        icon: CircleUserRound,
        subtitle:
          "Пароль, безопасность, личные данные, кросс-сервисные функции, рекламные предпочтения",
      },
    ],
  },
  {
    title: "Как вы используете Instagram",
    items: [
      { id: "edit-profile", label: "Редактировать профиль", icon: User },
      { id: "notifications", label: "Уведомления", icon: Bell },
    ],
  },
  {
    title: "Безопасность",
    items: [
      {
        id: "sessions",
        label: "Активные сеансы",
        icon: MonitorSmartphone,
        subtitle: "Устройства, на которых выполнен вход в ваш аккаунт",
      },
    ],
  },
  {
    title: "Кто может видеть ваш контент",
    items: [
      { id: "privacy", label: "Конфиденциальность аккаунта", icon: Lock },
      { id: "close-friends", label: "Близкие друзья", icon: Star },
      { id: "blocked", label: "Заблокированные", icon: Ban },
      { id: "story-location", label: "История и местоположение", icon: History },
    ],
  },
  {
    title: "Взаимодействие с вами",
    items: [
      { id: "messages-replies", label: "Сообщения и ответы на истории", icon: Send },
      { id: "tags", label: "Метки и упоминания", icon: AtSign },
      { id: "comments", label: "Комментарии", icon: MessageCircle },
      { id: "reposts", label: "Репосты и повторное использование", icon: Repeat2 },
      { id: "restricted", label: "Аккаунты с ограничениями", icon: CircleSlash2 },
      { id: "hidden-words", label: "Скрытые слова", icon: CaseSensitive },
    ],
  },
  {
    title: "Что вы видите",
    items: [
      { id: "muted", label: "Скрытые аккаунты", icon: BellOff },
      { id: "content-prefs", label: "Настройки контента", icon: Images },
      { id: "like-counts", label: 'Число отметок "Нравится" и репостов', icon: HeartOff },
      { id: "creator-subscriptions", label: "Платные подписки на авторов", icon: Crown },
    ],
  },
  {
    title: "Ваше приложение и медиафайлы",
    items: [
      { id: "archiving", label: "Архивирование и скачивание", icon: Download },
      { id: "accessibility", label: "Специальные возможности", icon: Accessibility },
      { id: "language", label: "Язык", icon: Languages },
      { id: "site-permissions", label: "Разрешения сайта", icon: Monitor },
    ],
  },
  {
    title: "Семейный центр",
    items: [
      { id: "family", label: "Родительский контроль для аккаунтов подростков", icon: House },
    ],
  },
  {
    title: "Для профессиональных аккаунтов",
    items: [
      { id: "account-type", label: "Тип аккаунта и инструменты", icon: ChartColumn },
      { id: "verify", label: "Подтвердите свой профиль", icon: BadgeCheck },
    ],
  },
  {
    title: "Информация и поддержка",
    items: [
      { id: "help", label: "Помощь", icon: LifeBuoy },
      { id: "privacy-center", label: "Центр конфиденциальности", icon: ShieldCheck },
      { id: "account-status", label: "Статус аккаунта", icon: UserRound },
    ],
  },
];

// Заголовок правой панели по id (включая разделы, которых нет в левом меню).
export function getSettingsTitle(id: string): string {
  if (id === "apps") return "Приложения и сайты";
  for (const section of SETTINGS_SECTIONS) {
    const item = section.items.find((entry) => entry.id === id);
    if (item) return item.label;
  }
  return "Настройки";
}
