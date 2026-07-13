"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandIcon } from "@/components/BrandIcon";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMyProfile } from "@/features/users/hooks";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

import { NAV_ITEMS } from "./nav-items";

export function AppSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const profileQuery = useMyProfile();

  const profileHref = user ? `/profile/${user.id}` : "/profile";
  const isProfileActive = !!user && pathname === `/profile/${user.id}`;

  return (
    <nav className="hidden shrink-0 border-r md:flex md:w-16 md:flex-col md:gap-1 md:p-2 lg:w-60 lg:p-4">
      <Link href="/" className="mb-4 flex items-center justify-center p-2 lg:justify-start lg:px-3">
        <BrandIcon className="h-8 w-8 rounded-lg" />
      </Link>

      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md p-2 hover:bg-muted lg:px-3",
              isActive && "bg-muted font-semibold",
            )}
          >
            <Icon className="size-6 shrink-0" />
            <span className="hidden lg:inline">{item.label}</span>
          </Link>
        );
      })}

      <Link
        href={profileHref}
        className={cn(
          "flex items-center gap-3 rounded-md p-2 hover:bg-muted lg:px-3",
          isProfileActive && "bg-muted font-semibold",
        )}
      >
        <Avatar className="size-6 shrink-0">
          <AvatarImage
            src={resolveImageUrl(profileQuery.data?.image)}
            alt={user?.userName ?? ""}
          />
          <AvatarFallback className="text-[10px]">
            {(user?.userName ?? "?").slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="hidden lg:inline">Профиль</span>
      </Link>

      <Link
        href="/settings"
        className={cn(
          "mt-auto flex items-center gap-3 rounded-md p-2 hover:bg-muted lg:px-3",
          pathname === "/settings" && "bg-muted font-semibold",
        )}
      >
        <Settings className="size-6 shrink-0" />
        <span className="hidden lg:inline">Настройки</span>
      </Link>

      <div className="flex items-center gap-3 p-2 lg:px-3">
        <ThemeToggle />
        <span className="hidden text-sm text-muted-foreground lg:inline">Тема</span>
      </div>
    </nav>
  );
}
