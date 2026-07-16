import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { userKeys } from "@/features/users/hooks";

import { blockUser, getBlockedUsers, unblockUser } from "./api";

export const blockKeys = {
  all: ["block"] as const,
  list: ["block", "list"] as const,
  ids: ["block", "ids"] as const,
};

const PAGE_SIZE = 20;

export function useBlockedUsersInfinite() {
  return useInfiniteQuery({
    queryKey: blockKeys.list,
    queryFn: ({ pageParam }) => getBlockedUsers({ pageNumber: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pageNumber < lastPage.totalPages ? lastPage.pageNumber + 1 : undefined,
  });
}

// Множество id заблокированных — для проверки «этот пользователь заблокирован?» на профиле.
export function useBlockedIds() {
  return useQuery({
    queryKey: blockKeys.ids,
    queryFn: () => getBlockedUsers({ pageNumber: 1, pageSize: 100 }),
    select: (data) => new Set(data.items.map((user) => user.id)),
    staleTime: 60_000,
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blockUser,
    onSuccess: (_data, userId) => {
      toast.success("Пользователь заблокирован");
      // Блокировка влечёт взаимную отписку — обновляем и профиль, и списки, и ленты.
      queryClient.invalidateQueries({ queryKey: blockKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.myProfile });
      queryClient.invalidateQueries({ queryKey: ["follows"] });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unblockUser,
    onSuccess: (_data, userId) => {
      toast.success("Пользователь разблокирован");
      queryClient.invalidateQueries({ queryKey: blockKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) });
    },
  });
}
