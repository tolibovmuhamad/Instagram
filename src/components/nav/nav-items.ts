import { Compass, Heart, Home, Plus, Search, Send, SquarePlay } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  // Показывать только в десктопном рейле. «Интересное» и «Уведомления» пока ведут
  // на /explore (отдельной ленты Explore и бэкенда уведомлений ещё нет) — в узкий
  // мобильный таб-бар их не выносим, чтобы не дублировать разделы.
  desktopOnly?: boolean;
}

// Порядок и иконки повторяют десктопный рейл Instagram 2026: Главная, Reels,
// Сообщения (самолётик), Поиск, Интересное (компас), Уведомления (сердце),
// Создать (плюс). Профиль-аватар добавляется отдельно в самих компонентах.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/reels", label: "Reels", icon: SquarePlay },
  { href: "/messages", label: "Сообщения", icon: Send },
  { href: "/explore", label: "Поиск", icon: Search },
  { href: "/explore", label: "Интересное", icon: Compass, desktopOnly: true },
  { href: "/explore", label: "Уведомления", icon: Heart, desktopOnly: true },
  { href: "/create", label: "Создать", icon: Plus },
];
