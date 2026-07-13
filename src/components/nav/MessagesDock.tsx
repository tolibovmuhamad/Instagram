"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Send } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getChats } from "@/features/chat/api";
import { chatKeys } from "@/features/chat/hooks";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

// Плавающая пилюля «Сообщения» в правом нижнем углу, как в десктопном
// Instagram 2026. Разделяет кэш со списком чатов, но сама не поллит —
// постоянный опрос нужен только на экране сообщений.
export function MessagesDock() {
  const pathname = usePathname();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const chatsQuery = useQuery({ queryKey: chatKeys.list, queryFn: getChats });

  if (pathname.startsWith("/messages")) return null;

  const companions = (chatsQuery.data ?? []).slice(0, 3).map((chat) => {
    const isOutgoing = chat.sendUserId === currentUserId;
    return {
      chatId: chat.chatId,
      name: isOutgoing ? chat.receiveUserName : chat.sendUserName,
      image: isOutgoing ? chat.receiveUserImage : chat.sendUserImage,
    };
  });

  return (
    <Link
      href="/messages"
      className="fixed right-6 bottom-6 z-40 hidden items-center gap-3 rounded-full border bg-popover py-3 pr-4 pl-5 text-popover-foreground shadow-lg transition-transform hover:scale-[1.03] md:flex"
    >
      <Send className="size-5" />
      <span className="text-sm font-semibold">Сообщения</span>
      {companions.length > 0 && (
        <span className="flex items-center -space-x-2">
          {companions.map((companion) => (
            <Avatar key={companion.chatId} className="size-6 ring-2 ring-popover">
              <AvatarImage src={resolveImageUrl(companion.image)} alt={companion.name ?? ""} />
              <AvatarFallback className="text-[10px]">
                {(companion.name ?? "?").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </span>
      )}
    </Link>
  );
}
