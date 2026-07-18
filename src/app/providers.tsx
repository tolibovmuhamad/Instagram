"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // Единый страж мультиаккаунта: при любой смене активного аккаунта полностью чистим кэш,
  // чтобы данные прошлого аккаунта (лента, профиль, чаты, счётчики) не «протекли» на экран.
  // Ловит все источники смены: явное переключение, выход-на-следующий и авто-удаление
  // активного аккаунта из axios-интерцептора при провале refresh (там queryClient недоступен).
  useEffect(() => {
    return useAuthStore.subscribe((state, prev) => {
      if (state.activeUserId !== prev.activeUserId) {
        queryClient.clear();
      }
    });
  }, [queryClient]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors position="top-center" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
