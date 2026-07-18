"use client";

import { Compass } from "lucide-react";

import { PostGrid } from "@/components/post/PostGrid";
import { useExploreFeedInfinite, usePopularPostsInfinite } from "@/features/posts/hooks";
import { dedupeById } from "@/lib/utils/dedupe";

export function ExploreGrid() {
  const exploreQuery = useExploreFeedInfinite();
  const explorePosts = dedupeById(exploreQuery.data?.pages.flatMap((page) => page.items) ?? []);

  // У аккаунта без истории персональные рекомендации приходят пустыми — тогда бэкенд
  // предлагает cold-start-ленту популярного. Запрашиваем её, только если это случилось.
  const needsPopular = exploreQuery.isSuccess && explorePosts.length === 0;
  const popularQuery = usePopularPostsInfinite(needsPopular);
  const popularPosts = dedupeById(popularQuery.data?.pages.flatMap((page) => page.items) ?? []);

  const activeQuery = needsPopular ? popularQuery : exploreQuery;
  const posts = needsPopular ? popularPosts : explorePosts;

  return (
    <main className="mx-auto w-full max-w-[935px] px-1 py-4 md:px-4 md:py-8">
      <PostGrid
        posts={posts}
        isLoading={exploreQuery.isPending || (needsPopular && popularQuery.isPending)}
        isError={activeQuery.isError}
        hasNextPage={activeQuery.hasNextPage}
        isFetchingNextPage={activeQuery.isFetchingNextPage}
        onLoadMore={() => activeQuery.fetchNextPage()}
        emptyMessage="Здесь пока нечего показать"
        emptyState={
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <Compass className="size-10 text-muted-foreground" />
            <p className="text-lg font-semibold">Здесь пока нечего показать</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Когда пользователи начнут публиковать посты, они появятся в «Интересном».
            </p>
          </div>
        }
      />
    </main>
  );
}
