import { Compass, Heart, Home, Plus, Search, Send, SquarePlay } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Только десктопный рейл — в узкий мобильный таб-бар такие пункты не выносим. */
  desktopOnly?: boolean;
}

// Порядок и иконки повторяют десктопный рейл Instagram 2026: Главная, Reels,
// Сообщения (самолётик), Поиск, Интересное (компас), Уведомления (сердце),
// Создать (плюс). Профиль-аватар добавляется отдельно в самих компонентах.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/reels", label: "Reels", icon: SquarePlay },
  { href: "/messages", label: "Сообщения", icon: Send },
  { href: "/search", label: "Поиск", icon: Search },
  { href: "/explore", label: "Интересное", icon: Compass, desktopOnly: true },
  // TODO: экрана уведомлений ещё нет, хотя модуль /Notification у бэкенда есть.
  { href: "/notifications", label: "Уведомления", icon: Heart, desktopOnly: true },
  { href: "/create", label: "Создать", icon: Plus },
];
