import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { userKeys } from "@/features/users/hooks";
import type { UserProfile } from "@/features/users/types";

import { getPrivacySettings, updatePrivacySettings } from "./api";
import type { PrivacySettings } from "./types";

export const settingsKeys = {
  privacy: ["settings", "privacy"] as const,
};

export function usePrivacySettings() {
  return useQuery({
    queryKey: settingsKeys.privacy,
    queryFn: getPrivacySettings,
    staleTime: 60_000,
  });
}

// Патч сливается с текущими настройками из кэша и уходит целиком. Оптимистично правим
// кэш, чтобы переключатели реагировали мгновенно; при ошибке откатываемся.
export function useUpdatePrivacySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<PrivacySettings>) => {
      const current = queryClient.getQueryData<PrivacySettings>(settingsKeys.privacy);
      if (!current) {
        throw new Error("Настройки ещё не загружены");
      }
      return updatePrivacySettings({ ...current, ...patch });
    },
    onMutate: (patch) => {
      const previous = queryClient.getQueryData<PrivacySettings>(settingsKeys.privacy);
      if (previous) {
        queryClient.setQueryData<PrivacySettings>(settingsKeys.privacy, {
          ...previous,
          ...patch,
        });
      }
      // Приватность аккаунта отражается и в профиле — держим их синхронными.
      if (patch.isPrivate !== undefined) {
        queryClient.setQueryData<UserProfile>(userKeys.myProfile, (old) =>
          old ? { ...old, isPrivate: patch.isPrivate! } : old,
        );
      }
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(settingsKeys.privacy, context.previous);
      }
    },
    onSuccess: () => {
      toast.success("Настройки сохранены");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.privacy });
      queryClient.invalidateQueries({ queryKey: userKeys.myProfile });
    },
  });
}
