"use client";

import { useState } from "react";
import {
  History,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Radio,
  Repeat,
  Settings,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccounts } from "@/features/auth/useAccounts";
import { useUnreadNotificationCount } from "@/features/notifications/hooks";
import { useMyProfile } from "@/features/users/hooks";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

import { AccountSwitcherDialog } from "./AccountSwitcherDialog";
import { NAV_ITEMS } from "./nav-items";
import { SearchPanel } from "./SearchPanel";

// Классический контурный «камера»-глиф Instagram (currentColor), как в оригинале:
// без градиента, чтобы совпадать с чёрным логотипом десктопного рейла.
function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

// Ряд навигации в стиле десктопного Instagram 2026: иконка слева, подпись справа.
// В свёрнутом состоянии (72px) видна только иконка; при наведении на весь сайдбар
// он раскрывается до 244px и плавно проявляет подписи.
const rowClass =
  "group/row flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-accent";

// Подпись: скрыта в свёрнутом рейле, проявляется при hover по сайдбару.
const labelClass =
  "whitespace-nowrap text-base opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100";

export function AppSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { accounts, activeUserId, logoutOne } = useAccounts();
  const profileQuery = useMyProfile();
  const unreadCount = useUnreadNotificationCount();
  const { resolvedTheme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const profileHref = user ? `/profile/${user.id}` : "/profile";
  const isProfileActive = !!user && pathname === `/profile/${user.id}`;
  const isDark = resolvedTheme === "dark";
  const hasUnread = (unreadCount.data ?? 0) > 0;

  // Клик по контенту закрывает панель через оверлей, но рейл лежит выше него и остаётся
  // кликабельным (как в оригинале), поэтому переходы из самого рейла закрываем вручную —
  // иначе панель осталась бы висеть поверх нового экрана.
  const closeSearch = () => setSearchOpen(false);

  return (
    <>
      <nav
        className={cn(
          "group/nav fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col overflow-hidden",
          "bg-background px-3 pb-5 pt-2 md:flex",
          // Плавно раскрывается по наведению — без рамки и тени, просто ширина.
          "transition-[width] duration-300 ease-out",
          // При открытой панели рейл остаётся узким: подписи разъезжались бы прямо
          // под ней. Так же ведёт себя оригинал.
          !searchOpen && "hover:w-[244px]",
        )}
      >
        <Link
          href="/"
          aria-label="Главная"
          onClick={closeSearch}
          className="mb-7 mt-5 flex items-center gap-4 p-3"
        >
          <InstagramGlyph className="size-7 shrink-0 transition-transform duration-300 group-hover/nav:scale-105" />
        </Link>

        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            // Поиск на десктопе — не переход на страницу, а выдвижная панель, как в
            // оригинале. Страница /search остаётся для мобильного таб-бара.
            const isSearch = item.href === "/search";
            const isActive = isSearch ? searchOpen : pathname === item.href;
            const Icon = item.icon;
            const showUnreadDot = item.href === "/notifications" && hasUnread;

            const row = (
              <>
                <span className="relative shrink-0">
                  <Icon
                    strokeWidth={2}
                    className={cn(
                      "size-6 transition-transform group-hover/row:scale-105 group-active/row:scale-95",
                      isActive && item.href === "/" && "fill-current",
                    )}
                  />
                  {showUnreadDot && (
                    <span
                      aria-label="Есть новые уведомления"
                      className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-destructive ring-2 ring-background"
                    />
                  )}
                </span>
                <span className={cn(labelClass, isActive && "font-semibold")}>
                  {item.label}
                </span>
              </>
            );

            if (isSearch) {
              return (
                <button
                  key={item.label}
                  type="button"
                  title={item.label}
                  aria-label={item.label}
                  aria-expanded={searchOpen}
                  onClick={() => setSearchOpen((prev) => !prev)}
                  className={rowClass}
                >
                  {row}
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                onClick={closeSearch}
                className={rowClass}
              >
                {row}
              </Link>
            );
          })}

          <Link
            href={profileHref}
            title="Профиль"
            aria-label="Профиль"
            aria-current={isProfileActive ? "page" : undefined}
            onClick={closeSearch}
            className={rowClass}
          >
            <Avatar
              className={cn(
                "size-6 shrink-0 transition-transform group-hover/row:scale-105",
                isProfileActive
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  : "ring-1 ring-border",
              )}
            >
              <AvatarImage
                src={resolveAvatarUrl(profileQuery.data?.image)}
                alt={user?.userName ?? ""}
              />
              <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
                {(user?.userName ?? "?").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className={cn(labelClass, isProfileActive && "font-semibold")}>
              Профиль
            </span>
          </Link>
        </div>

        <div className="mt-auto flex flex-col gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button type="button" title="Ещё" aria-label="Ещё" className={rowClass} />
              }
            >
              <Menu className="size-6 shrink-0 transition-transform group-hover/row:scale-105" />
              <span className={labelClass}>Ещё</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56 p-2">
              <DropdownMenuItem
                render={<Link href="/live/start" />}
                onClick={closeSearch}
                className="gap-3 rounded-lg px-3 py-2.5"
              >
                <Radio className="size-4.5" />
                Прямой эфир
              </DropdownMenuItem>
              <DropdownMenuItem
                render={<Link href="/live/my" />}
                onClick={closeSearch}
                className="gap-3 rounded-lg px-3 py-2.5"
              >
                <History className="size-4.5" />
                Мои эфиры
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                render={<Link href="/settings" />}
                onClick={closeSearch}
                className="gap-3 rounded-lg px-3 py-2.5"
              >
                <Settings className="size-4.5" />
                Настройки
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-3 rounded-lg px-3 py-2.5"
                onClick={() => setTheme(isDark ? "light" : "dark")}
              >
                {isDark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
                Сменить оформление
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-3 rounded-lg px-3 py-2.5"
                onClick={() => setSwitcherOpen(true)}
              >
                <Repeat className="size-4.5" />
                Сменить аккаунт
                {accounts.length > 1 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {accounts.length}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-3 rounded-lg px-3 py-2.5"
                onClick={() => {
                  if (activeUserId) void logoutOne(activeUserId);
                }}
              >
                <LogOut className="size-4.5" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <a
            href="https://about.meta.com/technologies/"
            target="_blank"
            rel="noreferrer"
            title="Также из Meta"
            aria-label="Также из Meta"
            className={rowClass}
          >
            <LayoutGrid className="size-6 shrink-0 transition-transform group-hover/row:scale-105" />
            <span className={labelClass}>Другие продукты&nbsp;…</span>
          </a>
        </div>
      </nav>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AccountSwitcherDialog open={switcherOpen} onOpenChange={setSwitcherOpen} />
    </>
  );
}
