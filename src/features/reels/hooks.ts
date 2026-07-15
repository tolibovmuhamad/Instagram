import { useInfiniteQuery } from "@tanstack/react-query";

import { getReels } from "./api";

// /Post/get-reels реально отвечает секундами (~15с при PageSize=6 — бэкенд отдаёт полные
// списки комментариев на каждый reel), поэтому держим страницу маленькой.
const REELS_PAGE_SIZE = 3;

export const reelKeys = {
  feed: ["reels", "feed"] as const,
};

export function useReelsInfinite() {
  return useInfiniteQuery({
    queryKey: reelKeys.feed,
    queryFn: ({ pageParam }) => getReels({ pageNumber: pageParam, pageSize: REELS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pageNumber < lastPage.totalPages ? lastPage.pageNumber + 1 : undefined,
  });
}
