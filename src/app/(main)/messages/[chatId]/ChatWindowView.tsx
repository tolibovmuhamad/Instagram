"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatMessages, useChats } from "@/features/chat/hooks";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

import { MessageBubble } from "./MessageBubble";
import { MessageForm } from "./MessageForm";

function useOtherParticipant(chatId: number) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const chatsQuery = useChats();
  const chat = chatsQuery.data?.find((c) => c.chatId === chatId);
  if (!chat) return null;
  return chat.sendUserId === currentUserId
    ? {
        userId: chat.receiveUserId,
        userName: chat.receiveUserName,
        userImage: chat.receiveUserImage,
      }
    : { userId: chat.sendUserId, userName: chat.sendUserName, userImage: chat.sendUserImage };
}

export function ChatWindowView({ chatId }: { chatId: number }) {
  const messagesQuery = useChatMessages(chatId);
  const other = useOtherParticipant(chatId);
  const bottomRef = useRef<HTMLDivElement>(null);

  // /Chat/get-chat-by-id отдаёт новые сообщения первыми — разворачиваем для чат-ленты.
  const messages = [...(messagesQuery.data ?? [])].reverse();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center gap-2 border-b p-3">
        <Link href="/messages" aria-label="Назад к диалогам" className="md:hidden">
          <ChevronLeft className="size-5" />
        </Link>
        {other ? (
          <Link href={`/profile/${other.userId}`} className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarImage src={resolveImageUrl(other.userImage)} alt={other.userName} />
              <AvatarFallback>{other.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{other.userName}</span>
          </Link>
        ) : (
          <Skeleton className="h-8 w-32" />
        )}
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messagesQuery.isPending &&
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-10 w-2/3" />)}

        {messagesQuery.isError && (
          <p className="py-16 text-center text-sm text-destructive">
            Не удалось загрузить переписку
          </p>
        )}

        {!messagesQuery.isPending && !messagesQuery.isError && messages.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Напишите первое сообщение
          </p>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.messageId} message={message} chatId={chatId} />
        ))}
        <div ref={bottomRef} />
      </div>

      <MessageForm chatId={chatId} />
    </div>
  );
}
