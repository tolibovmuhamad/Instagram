"use client";

import { PostGrid } from "@/components/post/PostGrid";
import { SearchBox } from "@/components/search/SearchBox";
import { usePopularPostsInfinite } from "@/features/posts/hooks";
import { dedupeById } from "@/lib/utils/dedupe";

/**
 * Сетка «Популярное» под строкой поиска — так устроен поиск в мобильном Instagram.
 * Отдельным компонентом, чтобы запрос уходил только когда сетка на экране: SearchBox
 * рендерит её лишь при пустом запросе, то есть во время поиска она размонтирована.
 */
function PopularGrid() {
  const popularQuery = usePopularPostsInfinite(true);
  const posts = dedupeById(popularQuery.data?.pages.flatMap((page) => page.items) ?? []);

  return (
    <section>
      <h2 className="mb-3 px-1 text-sm font-semibold text-muted-foreground">Популярное</h2>
      <PostGrid
        posts={posts}
        isLoading={popularQuery.isPending}
        isError={popularQuery.isError}
        hasNextPage={popularQuery.hasNextPage}
        isFetchingNextPage={popularQuery.isFetchingNextPage}
        onLoadMore={() => popularQuery.fetchNextPage()}
        emptyMessage="Пока нет популярных публикаций"
      />
    </section>
  );
}

/**
 * Страница поиска — мобильная: на десктопе «Поиск» в рейле открывает выдвижную панель
 * (SearchPanel), а не ведёт сюда. Открыть страницу по прямой ссылке всё ещё можно.
 */
export function SearchView() {
  return (
    <div className="mx-auto w-full max-w-[975px] px-2 py-4 md:px-4">
      <SearchBox idleContent={<PopularGrid />} columnClassName="mx-auto max-w-md" />
    </div>
  );
}
