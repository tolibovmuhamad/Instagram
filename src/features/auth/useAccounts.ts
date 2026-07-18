"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getMyProfile } from "@/features/users/api";
import { useAuthStore } from "@/store/auth";

import { logoutRequest } from "./api";
import { MAX_ACCOUNTS } from "./types";

/**
 * После логина в JWT есть только ник/email — профиль (аватар, полное имя, галочка
 * верификации) подтягиваем отдельным запросом и дозаполняем аккаунт в сторе. Best-effort:
 * без этого аккаунт работает, просто в переключателе будет плейсхолдер-аватар.
 */
export async function enrichActiveAccountProfile() {
  try {
    const profile = await getMyProfile();
    useAuthStore.getState().updateAccountProfile(profile.userId, {
      userName: profile.userName,
      fullName: profile.fullName,
      avatar: profile.image,
      isVerified: profile.isVerified,
    });
  } catch {
    // Профиль не подтянулся — не критично, аккаунт уже добавлен по данным из токена.
  }
}

/**
 * Экшены мультиаккаунта поверх стора: переключение, выход из одного/всех аккаунтов.
 *
 * Здесь же — обязательная гигиена клиента: перед сменой активного аккаунта отменяем
 * незавершённые запросы (они уходили со старым токеном) и полностью чистим кэш React Query,
 * иначе на экран «протечёт» лента/профиль/чаты прошлого аккаунта. SignalR-хаб LiveHub
 * переподключается сам — по authEpoch в useLiveHub.
 */
export function useAccounts() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const accounts = useAuthStore((s) => s.accounts);
  const activeUserId = useAuthStore((s) => s.activeUserId);

  const switchTo = useCallback(
    async (userId: string) => {
      if (userId === useAuthStore.getState().activeUserId) return;
      // Отменяем запросы старого аккаунта, затем меняем активного и сбрасываем кэш —
      // порядок важен: сначала гасим летящие ответы, чтобы они не осели в свежий кэш.
      await queryClient.cancelQueries();
      useAuthStore.getState().switchAccount(userId);
      queryClient.clear();
      router.push("/");
    },
    [queryClient, router],
  );

  const logoutOne = useCallback(
    async (userId: string) => {
      const account = useAuthStore.getState().accounts.find((a) => a.userId === userId);
      const wasActive = userId === useAuthStore.getState().activeUserId;
      // Отзываем сессию именно этого аккаунта его же токеном (мимо интерцептора).
      if (account) void logoutRequest(account.accessToken).catch(() => {});

      if (wasActive) await queryClient.cancelQueries();
      useAuthStore.getState().removeAccount(userId);

      if (wasActive) {
        queryClient.clear();
        const next = useAuthStore.getState().activeUserId;
        router.replace(next ? "/" : "/login");
      }
    },
    [queryClient, router],
  );

  const logoutAll = useCallback(async () => {
    const all = useAuthStore.getState().accounts;
    all.forEach((a) => void logoutRequest(a.accessToken).catch(() => {}));
    await queryClient.cancelQueries();
    useAuthStore.getState().logoutAll();
    queryClient.clear();
    router.replace("/login");
    toast.success("Вы вышли из всех аккаунтов");
  }, [queryClient, router]);

  return {
    accounts,
    activeUserId,
    canAddMore: accounts.length < MAX_ACCOUNTS,
    switchTo,
    logoutOne,
    logoutAll,
  };
}
