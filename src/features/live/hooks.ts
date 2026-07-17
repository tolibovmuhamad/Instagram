import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addLiveComment,
  approveGuest,
  banViewer,
  cancelGuestRequest,
  declineGuest,
  deleteLiveComment,
  endLive,
  getActiveGuests,
  getActiveLives,
  getGuestRequests,
  getLiveById,
  getLiveComments,
  getLiveStats,
  getLiveViewers,
  getMyStreams,
  joinLive,
  leaveLive,
  pinLiveComment,
  removeGuest,
  requestGuest,
  saveLiveToStory,
  sendLiveLike,
  startLive,
  unbanViewer,
  updateLiveTitle,
} from "./api";

export const liveKeys = {
  active: ["live", "active"] as const,
  stream: (id: number) => ["live", "stream", id] as const,
  comments: (id: number) => ["live", "comments", id] as const,
  viewers: (id: number) => ["live", "viewers", id] as const,
  guestRequests: (id: number) => ["live", "guestRequests", id] as const,
  activeGuests: (id: number) => ["live", "activeGuests", id] as const,
  stats: (id: number) => ["live", "stats", id] as const,
  myStreams: ["live", "myStreams"] as const,
};

// Realtime на бэкенде нет (см. CLAUDE.md) — эфир живой только за счёт опроса. Видео идёт
// через LiveKit, а вот счётчики, комментарии и заявки в гости приходится опрашивать.
// Интервалы разные: комментарии должны ощущаться живыми, статистика — нет.
const COMMENTS_POLL_MS = 3000;
const STREAM_POLL_MS = 5000;
const GUESTS_POLL_MS = 5000;
const ACTIVE_POLL_MS = 30000;
const PAGE_SIZE = 20;

export function useActiveLives() {
  return useQuery({
    queryKey: liveKeys.active,
    queryFn: () => getActiveLives({ pageNumber: 1, pageSize: PAGE_SIZE }),
    refetchInterval: ACTIVE_POLL_MS,
  });
}

/** `enabled: false` — чтобы не опрашивать завершённый эфир. */
export function useLiveStream(streamId: number, poll = true) {
  return useQuery({
    queryKey: liveKeys.stream(streamId),
    queryFn: () => getLiveById(streamId),
    enabled: !!streamId,
    refetchInterval: poll ? STREAM_POLL_MS : false,
  });
}

export function useLiveComments(streamId: number, poll = true) {
  return useQuery({
    queryKey: liveKeys.comments(streamId),
    queryFn: () => getLiveComments({ streamId, pageNumber: 1, pageSize: PAGE_SIZE }),
    enabled: !!streamId,
    refetchInterval: poll ? COMMENTS_POLL_MS : false,
  });
}

export function useLiveViewers(streamId: number, enabled: boolean) {
  return useQuery({
    queryKey: liveKeys.viewers(streamId),
    queryFn: () => getLiveViewers({ streamId, pageNumber: 1, pageSize: PAGE_SIZE }),
    enabled: enabled && !!streamId,
    refetchInterval: GUESTS_POLL_MS,
  });
}

export function useGuestRequests(streamId: number, enabled: boolean) {
  return useQuery({
    queryKey: liveKeys.guestRequests(streamId),
    queryFn: () => getGuestRequests(streamId),
    enabled: enabled && !!streamId,
    refetchInterval: GUESTS_POLL_MS,
  });
}

export function useActiveGuests(streamId: number) {
  return useQuery({
    queryKey: liveKeys.activeGuests(streamId),
    queryFn: () => getActiveGuests(streamId),
    enabled: !!streamId,
    refetchInterval: GUESTS_POLL_MS,
  });
}

export function useLiveStats(streamId: number, enabled: boolean, poll = true) {
  return useQuery({
    queryKey: liveKeys.stats(streamId),
    queryFn: () => getLiveStats(streamId),
    enabled: enabled && !!streamId,
    refetchInterval: poll ? STREAM_POLL_MS : false,
  });
}

/**
 * Свой незавершённый эфир, если он есть. Нужен, потому что бэкенд разрешает ровно один
 * активный эфир на пользователя и на второй `start` отвечает 400 «У вас уже идёт активный
 * эфир.». А зависнуть он может легко: закрыл вкладку — эфир остался «в эфире».
 */
export function useMyActiveStream() {
  return useQuery({
    queryKey: [...liveKeys.myStreams, "active"],
    queryFn: async () => {
      const page = await getMyStreams({ pageNumber: 1, pageSize: 10 });
      return page.items.find((s) => s.status === "Live") ?? null;
    },
  });
}

export function useMyStreamsInfinite() {
  return useInfiniteQuery({
    queryKey: liveKeys.myStreams,
    queryFn: ({ pageParam }) => getMyStreams({ pageNumber: pageParam, pageSize: 12 }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pageNumber < last.totalPages ? last.pageNumber + 1 : undefined,
  });
}

// --- Мутации --------------------------------------------------------------------

export function useStartLive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startLive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liveKeys.active });
      queryClient.invalidateQueries({ queryKey: liveKeys.myStreams });
    },
  });
}

export function useEndLive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endLive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live"] });
    },
  });
}

export function useUpdateLiveTitle(streamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => updateLiveTitle(streamId, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: liveKeys.stream(streamId) }),
  });
}

export function useJoinLive() {
  return useMutation({ mutationFn: joinLive });
}

export function useLeaveLive() {
  return useMutation({ mutationFn: leaveLive });
}

export function useAddLiveComment(streamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => addLiveComment(streamId, text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: liveKeys.comments(streamId) }),
  });
}

export function useDeleteLiveComment(streamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLiveComment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: liveKeys.comments(streamId) }),
  });
}

export function usePinLiveComment(streamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pinLiveComment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: liveKeys.comments(streamId) }),
  });
}

// Сердечки летят пачками — инвалидация на каждое сделала бы шторм запросов; счётчик и так
// приедет ближайшим опросом эфира.
export function useSendLiveLike(streamId: number) {
  return useMutation({ mutationFn: () => sendLiveLike(streamId) });
}

export function useRequestGuest(streamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => requestGuest(streamId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: liveKeys.guestRequests(streamId) }),
  });
}

export function useCancelGuestRequest(streamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelGuestRequest(streamId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: liveKeys.guestRequests(streamId) }),
  });
}

export function useApproveGuest(streamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liveKeys.guestRequests(streamId) });
      queryClient.invalidateQueries({ queryKey: liveKeys.activeGuests(streamId) });
      queryClient.invalidateQueries({ queryKey: liveKeys.stream(streamId) });
    },
  });
}

export function useDeclineGuest(streamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: declineGuest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: liveKeys.guestRequests(streamId) }),
  });
}

export function useRemoveGuest(streamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeGuest(streamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liveKeys.activeGuests(streamId) });
      queryClient.invalidateQueries({ queryKey: liveKeys.stream(streamId) });
    },
  });
}

export function useBanViewer(streamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => banViewer(streamId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: liveKeys.viewers(streamId) }),
  });
}

export function useUnbanViewer(streamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => unbanViewer(streamId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: liveKeys.viewers(streamId) }),
  });
}

export function useSaveLiveToStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveLiveToStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liveKeys.myStreams });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}
