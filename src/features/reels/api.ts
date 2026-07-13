import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

import type { Reel } from "./types";

export interface GetReelsParams {
  pageNumber: number;
  pageSize: number;
}

export async function getReels(params: GetReelsParams) {
  const { data } = await apiClient.get<Paginated<Reel>>("/Post/get-reels", {
    params: { PageNumber: params.pageNumber, PageSize: params.pageSize },
  });
  return data;
}
