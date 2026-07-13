"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { PostFeedList } from "@/components/post/PostFeedList";
import { StoryAvatarRail } from "@/components/story/StoryAvatarRail";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFeedInfinite, useFollowingFeedInfinite } from "@/features/posts/hooks";

type FeedKind = "all" | "following";

const FEED_LABELS: Record<FeedKind, string> = {
  all: "Для вас",
  following: "Подписки",
};

export default function FeedPage() {
  const [feedKind, setFeedKind] = useState<FeedKind>("all");
  const feedQuery = useFeedInfinite();
  const followingQuery = useFollowingFeedInfinite();

  const activeQuery = feedKind === "all" ? feedQuery : followingQuery;
  const posts = activeQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <main className="mx-auto w-full max-w-[470px] px-3 pt-2 pb-8 md:px-0 md:pt-6">
      <StoryAvatarRail />

      {/* Вместо вкладок — компактный переключатель ленты, как «Для вас ⌄» в Instagram */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="mt-1 mb-2 flex items-center gap-1 rounded-lg py-1 text-base font-bold"
            />
          }
        >
          {FEED_LABELS[feedKind]}
          <ChevronDown className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          {(Object.keys(FEED_LABELS) as FeedKind[]).map((kind) => (
            <DropdownMenuItem
              key={kind}
              className={feedKind === kind ? "font-semibold" : undefined}
              onClick={() => setFeedKind(kind)}
            >
              {FEED_LABELS[kind]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <PostFeedList
        posts={posts}
        isLoading={activeQuery.isPending}
        isError={activeQuery.isError}
        hasNextPage={activeQuery.hasNextPage}
        isFetchingNextPage={activeQuery.isFetchingNextPage}
        onLoadMore={() => activeQuery.fetchNextPage()}
        emptyMessage={
          feedKind === "all"
            ? "Пока нет публикаций"
            : "Подпишитесь на кого-нибудь, чтобы видеть публикации здесь"
        }
      />
    </main>
  );
}
