"use client";

import { LayoutGrid, LogOut, Menu, Moon, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import { BrandIcon } from "@/components/BrandIcon";
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

const railItemClass =
  "group flex size-12 items-center justify-center rounded-lg transition-colors hover:bg-accent";

// Узкий рейл в духе десктопного Instagram 2026: только иконки, логотип сверху,
// основная группа отцентрована по вертикали, «Ещё» и Meta-грид прижаты к низу.
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
    <nav className="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col items-center bg-background px-3 py-4 md:flex">
      <Link href="/" aria-label="Главная" className={cn(railItemClass, "shrink-0")}>
        <BrandIcon className="size-6 rounded-md transition-transform group-hover:scale-105" />
      </Link>

      <div className="my-auto flex flex-col gap-1 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={railItemClass}
            >
              <Icon
                strokeWidth={isActive ? 2.5 : 2}
                className={cn(
                  "size-6 transition-transform group-hover:scale-105",
                  isActive && item.href === "/" && "fill-current",
                )}
              />
            </Link>
          );
        })}

        <Link href={profileHref} title="Профиль" aria-label="Профиль" className={railItemClass}>
          <Avatar
            className={cn(
              "size-6 transition-transform group-hover:scale-105",
              isProfileActive && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
            )}
          >
            <AvatarImage
              src={resolveImageUrl(profileQuery.data?.image)}
              alt={user?.userName ?? ""}
            />
            <AvatarFallback className="text-[10px]">
              {(user?.userName ?? "?").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>

      <div className="flex shrink-0 flex-col gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<button type="button" title="Ещё" aria-label="Ещё" className={railItemClass} />}
          >
            <Menu className="size-6 transition-transform group-hover:scale-105" />
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
          className={railItemClass}
        >
          <LayoutGrid className="size-6 transition-transform group-hover:scale-105" />
        </a>
      </div>
    </nav>
  );
}
