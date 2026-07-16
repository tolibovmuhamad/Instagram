import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getActiveSessions, revokeAllOtherSessions, revokeSession } from "./api";
import type { ActiveSession } from "./types";

export const sessionKeys = {
  all: ["sessions"] as const,
  list: ["sessions", "list"] as const,
};

export function useActiveSessions() {
  return useQuery({
    queryKey: sessionKeys.list,
    queryFn: getActiveSessions,
    // Текущая сессия первой, остальные — по свежести активности.
    select: (sessions: ActiveSession[]) =>
      [...sessions].sort((a, b) => {
        if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
        return Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt);
      }),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      toast.success("Сеанс завершён");
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useRevokeAllOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeAllOtherSessions,
    onSuccess: () => {
      toast.success("Все остальные сеансы завершены");
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}
