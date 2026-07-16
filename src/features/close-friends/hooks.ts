import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { addCloseFriend, getCloseFriends, removeCloseFriend } from "./api";

export const closeFriendKeys = {
  all: ["close-friends"] as const,
  list: ["close-friends", "list"] as const,
  ids: ["close-friends", "ids"] as const,
};

const PAGE_SIZE = 20;

export function useCloseFriendsInfinite() {
  return useInfiniteQuery({
    queryKey: closeFriendKeys.list,
    queryFn: ({ pageParam }) => getCloseFriends({ pageNumber: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pageNumber < lastPage.totalPages ? lastPage.pageNumber + 1 : undefined,
  });
}

// Множество id близких друзей — для быстрой проверки «этот пользователь в близких?»
// на чужом профиле. Список обычно небольшой, поэтому берём одну крупную страницу.
export function useCloseFriendIds() {
  return useQuery({
    queryKey: closeFriendKeys.ids,
    queryFn: () => getCloseFriends({ pageNumber: 1, pageSize: 100 }),
    select: (data) => new Set(data.items.map((user) => user.id)),
    staleTime: 60_000,
  });
}

export function useAddCloseFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addCloseFriend,
    onSuccess: () => {
      toast.success("Добавлено в близкие друзья");
      queryClient.invalidateQueries({ queryKey: closeFriendKeys.all });
    },
  });
}

export function useRemoveCloseFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeCloseFriend,
    onSuccess: () => {
      toast.success("Удалено из близких друзей");
      queryClient.invalidateQueries({ queryKey: closeFriendKeys.all });
    },
  });
}
