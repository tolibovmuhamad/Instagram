"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMyProfile } from "@/features/users/hooks";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

import { NAV_ITEMS } from "./nav-items";

export function MobileTabBar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const profileQuery = useMyProfile();
  const profileHref = user ? `/profile/${user.id}` : "/profile";
  const isProfileActive = !!user && pathname === `/profile/${user.id}`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t bg-background py-2 md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} aria-label={item.label} className="p-2">
            <Icon className={cn("size-6", isActive && "text-foreground")} />
          </Link>
        );
      })}
      <Link href={profileHref} aria-label="Профиль" className="p-2">
        <Avatar className={cn("size-6", isProfileActive && "ring-2 ring-foreground")}>
          <AvatarImage
            src={resolveImageUrl(profileQuery.data?.image)}
            alt={user?.userName ?? ""}
          />
          <AvatarFallback className="text-[10px]">
            {(user?.userName ?? "?").slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
    </nav>
  );
}
