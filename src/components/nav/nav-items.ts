import { Home, Plus, Search, Send, SquarePlay } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// «Уведомления» из UI-ориентиров ТЗ намеренно не добавлены — у бэкенда нет
// Notification-контроллера (проверено по живому Swagger), показывать нечего.
// Порядок и иконки повторяют десктопный рейл Instagram 2026:
// Главная, Reels, Сообщения (самолётик), Поиск, Создать (плюс).
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/reels", label: "Reels", icon: SquarePlay },
  { href: "/messages", label: "Сообщения", icon: Send },
  { href: "/explore", label: "Поиск", icon: Search },
  { href: "/create", label: "Создать", icon: Plus },
];
