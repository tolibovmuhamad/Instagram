"use client";

import { LayoutGrid, LogOut, Menu, Moon, Settings, Sun } from "lucide-react";
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
import { useMyProfile } from "@/features/users/hooks";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

import { NAV_ITEMS } from "./nav-items";

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
  const logout = useAuthStore((state) => state.logout);
  const profileQuery = useMyProfile();
  const { resolvedTheme, setTheme } = useTheme();

  const profileHref = user ? `/profile/${user.id}` : "/profile";
  const isProfileActive = !!user && pathname === `/profile/${user.id}`;
  const isDark = resolvedTheme === "dark";

  return (
    <nav
      className={cn(
        "group/nav fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col overflow-hidden",
        "bg-background px-3 pb-5 pt-2 md:flex",
        // Плавно раскрывается по наведению — без рамки и тени, просто ширина.
        "transition-[width] duration-300 ease-out hover:w-[244px]",
      )}
    >
      <Link
        href="/"
        aria-label="Главная"
        className="mb-7 mt-5 flex items-center gap-4 p-3"
      >
        <InstagramGlyph className="size-7 shrink-0 transition-transform duration-300 group-hover/nav:scale-105" />
      </Link>

      <div className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={rowClass}
            >
              <Icon
                strokeWidth={2}
                className={cn(
                  "size-6 shrink-0 transition-transform group-hover/row:scale-105 group-active/row:scale-95",
                  isActive && item.href === "/" && "fill-current",
                )}
              />
              <span className={cn(labelClass, isActive && "font-semibold")}>
                {item.label}
              </span>
            </Link>
          );
        })}

        <Link
          href={profileHref}
          title="Профиль"
          aria-label="Профиль"
          aria-current={isProfileActive ? "page" : undefined}
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
              src={resolveImageUrl(profileQuery.data?.image)}
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
              render={<Link href="/settings" />}
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
            <DropdownMenuItem className="gap-3 rounded-lg px-3 py-2.5" onClick={logout}>
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
  );
}
