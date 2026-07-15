"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useChat } from "@/features/chat/hooks";
import { resolveAvatarUrl } from "@/lib/utils/image";

import { MessageBubble } from "./MessageBubble";
import { MessageForm } from "./MessageForm";

export function ChatWindowView({ chatId }: { chatId: number }) {
  const chatQuery = useChat(chatId);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Чат сам несёт собеседника — определять, кто из двух участников «я», больше не нужно.
  const chat = chatQuery.data;
  const messages = chat?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center gap-2 border-b p-3">
        <Link href="/messages" aria-label="Назад к диалогам" className="md:hidden">
          <ChevronLeft className="size-5" />
        </Link>
        {chat ? (
          <Link href={`/profile/${chat.userId}`} className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarImage src={resolveAvatarUrl(chat.userImage)} alt={chat.userName} />
              <AvatarFallback>{chat.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{chat.userName}</span>
          </Link>
        ) : (
          <Skeleton className="h-8 w-32" />
        )}
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {chatQuery.isPending &&
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-10 w-2/3" />)}

        {chatQuery.isError && (
          <p className="py-16 text-center text-sm text-destructive">
            Не удалось загрузить переписку
          </p>
        )}

        {!chatQuery.isPending && !chatQuery.isError && messages.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Напишите первое сообщение
          </p>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} chatId={chatId} />
        ))}
        <div ref={bottomRef} />
      </div>

      <MessageForm chatId={chatId} />
    </div>
  );
}
