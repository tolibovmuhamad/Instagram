"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquarePlus, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useChats, useDeleteChat } from "@/features/chat/hooks";
import type { ChatSummary } from "@/features/chat/types";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

import { NewChatDialog } from "./NewChatDialog";

function getOtherParticipant(chat: ChatSummary, currentUserId: string | undefined) {
  if (chat.sendUserId === currentUserId) {
    return {
      userId: chat.receiveUserId,
      userName: chat.receiveUserName,
      userImage: chat.receiveUserImage,
    };
  }
  return { userId: chat.sendUserId, userName: chat.sendUserName, userImage: chat.sendUserImage };
}

export function ChatListView() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const chatsQuery = useChats();
  const deleteChat = useDeleteChat();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  const chats = chatsQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Сообщения</h1>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsNewChatOpen(true)}
          aria-label="Новое сообщение"
        >
          <MessageSquarePlus className="size-5" />
        </Button>
      </div>

      {chatsQuery.isPending &&
        Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 p-2">
            <Skeleton className="size-12 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}

      {chatsQuery.isError && (
        <p className="py-16 text-center text-sm text-destructive">Не удалось загрузить диалоги</p>
      )}

      {!chatsQuery.isPending && !chatsQuery.isError && chats.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">Пока нет диалогов</p>
      )}

      <div className="space-y-1">
        {chats.map((chat) => {
          const other = getOtherParticipant(chat, currentUserId);
          return (
            <div
              key={chat.chatId}
              className="group flex items-center gap-3 rounded-md p-2 hover:bg-muted"
            >
              <Link href={`/messages/${chat.chatId}`} className="flex flex-1 items-center gap-3">
                <Avatar className="size-12">
                  <AvatarImage src={resolveImageUrl(other.userImage)} alt={other.userName} />
                  <AvatarFallback>{other.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{other.userName}</span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 opacity-0 group-hover:opacity-100"
                aria-label="Удалить чат"
                onClick={() => deleteChat.mutate(chat.chatId)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <NewChatDialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen} />
    </div>
  );
}
