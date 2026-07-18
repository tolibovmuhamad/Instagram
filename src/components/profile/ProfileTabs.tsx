"use client";

import { Bookmark, Camera, Contact, Grid, SquarePlay } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PostGrid } from "@/components/post/PostGrid";
import { useUserPostsInfinite } from "@/features/posts/hooks";
import { useFavoritePostsInfinite } from "@/features/users/hooks";
import { cn } from "@/lib/utils";
import { dedupeById } from "@/lib/utils/dedupe";

interface ProfileTabsProps {
  userId: string;
  isOwnProfile: boolean;
}

type TabId = "posts" | "reels" | "saved" | "tagged";

// Пустое состояние с иконкой в кружке — как экран «Поделиться фото» в Instagram.
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="grid size-16 place-items-center rounded-full border-2 border-foreground">
        <Icon className="size-8" strokeWidth={1.5} />
      </span>
      <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h2>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Link href={action.href} className="text-sm font-semibold text-[#0095f6] hover:opacity-70">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function ProfileTabs({ userId, isOwnProfile }: ProfileTabsProps) {
  const [active, setActive] = useState<TabId>("posts");

  const postsQuery = useUserPostsInfinite(userId);
  const favoritesQuery = useFavoritePostsInfinite(isOwnProfile && active === "saved");

  const posts = dedupeById(postsQuery.data?.pages.flatMap((page) => page.items) ?? []);
  const favorites = dedupeById(favoritesQuery.data?.pages.flatMap((page) => page.items) ?? []);

  const tabs: { id: TabId; icon: LucideIcon; label: string }[] = [
    { id: "posts", icon: Grid, label: "Публикации" },
    { id: "reels", icon: SquarePlay, label: "Reels" },
    ...(isOwnProfile
      ? [{ id: "saved" as const, icon: Bookmark, label: "Сохранённое" }]
      : []),
    { id: "tagged", icon: Contact, label: "Отмеченные" },
  ];

  return (
    <div className="mx-auto w-full max-w-[935px]">
      {/* Панель вкладок: только иконки по центру, активная — с верхней чертой. */}
      <div className="flex justify-center gap-12 border-t md:gap-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setActive(tab.id)}
              className={cn(
                "-mt-px flex items-center gap-1.5 border-t py-4 text-xs font-semibold uppercase tracking-widest transition-colors",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-[22px]" strokeWidth={isActive ? 2 : 1.75} />
            </button>
          );
        })}
      </div>

      <div className="pt-1">
        {active === "posts" && (
          <PostGrid
            posts={posts}
            isLoading={postsQuery.isPending}
            isError={postsQuery.isError}
            hasNextPage={postsQuery.hasNextPage}
            isFetchingNextPage={postsQuery.isFetchingNextPage}
            onLoadMore={() => postsQuery.fetchNextPage()}
            emptyMessage="Пока нет публикаций"
            emptyState={
              isOwnProfile ? (
                <EmptyState
                  icon={Camera}
                  title="Поделиться фото"
                  description="Фото, которыми вы делитесь, будут показываться в вашем профиле."
                  action={{ href: "/create", label: "Поделитесь своим первым фото" }}
                />
              ) : undefined
            }
          />
        )}

        {active === "reels" && (
          <EmptyState icon={SquarePlay} title="Пока нет Reels" />
        )}

        {active === "saved" && isOwnProfile && (
          <PostGrid
            posts={favorites}
            isLoading={favoritesQuery.isPending}
            isError={favoritesQuery.isError}
            hasNextPage={favoritesQuery.hasNextPage}
            isFetchingNextPage={favoritesQuery.isFetchingNextPage}
            onLoadMore={() => favoritesQuery.fetchNextPage()}
            emptyMessage="Нет сохранённых публикаций"
          />
        )}

        {active === "tagged" && (
          <EmptyState
            icon={Contact}
            title="Фото и видео с вами"
            description="Когда вас отметят на фото или видео, они появятся здесь."
          />
        )}
      </div>
    </div>
  );
}
