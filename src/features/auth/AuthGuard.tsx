"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (hasHydrated && !accessToken) {
      router.replace("/login");
    }
  }, [hasHydrated, accessToken, router]);

  // До завершения гидратации zustand-persist не знаем, есть ли токен в localStorage —
  // рендерим пусто, чтобы не мигать приватным контентом и не дёргать редирект раньше времени.
  if (!hasHydrated || !accessToken) {
    return null;
  }

  return <>{children}</>;
}
