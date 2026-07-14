"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { ChatListView } from "./ChatListView";

// Двухпанельный вид «Сообщений», как в вебе Instagram: слева список диалогов,
// справа — переписка или пустое состояние. На мобильном показываем что-то одно
// в зависимости от того, открыт ли конкретный чат (/messages/{id}).
export function MessagesShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasActiveChat = /^\/messages\/.+/.test(pathname);

  return (
    <div className="flex h-[calc(100dvh-4rem)] w-full md:h-dvh">
      <aside
        className={cn(
          "h-full w-full shrink-0 border-r md:w-[350px] xl:w-[397px]",
          hasActiveChat && "hidden md:block",
        )}
      >
        <ChatListView />
      </aside>
      <main className={cn("h-full min-w-0 flex-1", !hasActiveChat && "hidden md:block")}>
        {children}
      </main>
    </div>
  );
}
