import { Clapperboard, Home, MessageCircle, Search, SquarePlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// «Уведомления» из UI-ориентиров ТЗ намеренно не добавлены — у бэкенда нет
// Notification-контроллера (проверено по живому Swagger), показывать нечего.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/explore", label: "Поиск", icon: Search },
  { href: "/reels", label: "Reels", icon: Clapperboard },
  { href: "/messages", label: "Сообщения", icon: MessageCircle },
  { href: "/create", label: "Создать", icon: SquarePlus },
];
