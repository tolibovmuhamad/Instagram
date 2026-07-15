"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, Send, X } from "lucide-react";

import { MessageBubble } from "@/app/(main)/messages/[chatId]/MessageBubble";
import { MessageForm } from "@/app/(main)/messages/[chatId]/MessageForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getChats } from "@/features/chat/api";
import { chatKeys, useChat } from "@/features/chat/hooks";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/lib/utils/image";

// Плавающий док «Сообщения» в правом нижнем углу, как в десктопном Instagram 2026.
// Раскрывается прямо на месте: сначала список диалогов, по клику — переписка с полем
// ввода, чтобы ответить, не уходя со страницы. Опрос списка включаем только когда
// панель открыта (на экране /messages опрос делает сам раздел).
export function MessagesDock() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

  const chatsQuery = useQuery({
    queryKey: chatKeys.list,
    queryFn: getChats,
    refetchInterval: isOpen ? 8000 : false,
  });

  if (pathname.startsWith("/messages")) return null;

  const chats = chatsQuery.data ?? [];
  const previewCompanions = chats.slice(0, 3);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Открыть сообщения"
        className="fixed right-6 bottom-6 z-40 hidden items-center gap-3 rounded-full border bg-popover py-3 pr-4 pl-5 text-popover-foreground shadow-lg transition-transform hover:scale-[1.03] md:flex"
      >
        <Send className="size-5" />
        <span className="text-sm font-semibold">Сообщения</span>
        {previewCompanions.length > 0 && (
          <span className="flex items-center -space-x-2">
            {previewCompanions.map((companion) => (
              <Avatar key={companion.id} className="size-6 ring-2 ring-popover">
                <AvatarImage src={resolveAvatarUrl(companion.userImage)} alt={companion.userName ?? ""} />
                <AvatarFallback className="text-[10px]">
                  {(companion.userName ?? "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </span>
        )}
      </button>
    );
  }

  const activeChat = chats.find((chat) => chat.id === activeChatId);

  return (
    <div className="fixed right-6 bottom-6 z-40 hidden h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-xl md:flex">
      <header className="flex items-center gap-2 border-b px-3 py-2.5">
        {activeChatId !== null ? (
          <>
            <button
              type="button"
              onClick={() => setActiveChatId(null)}
              aria-label="Назад к диалогам"
              className="rounded-full p-1 hover:bg-accent"
            >
              <ChevronLeft className="size-5" />
            </button>
            {activeChat ? (
              <Link
                href={`/profile/${activeChat.userId}`}
                className="flex min-w-0 items-center gap-2"
              >
                <Avatar className="size-7">
                  <AvatarImage src={resolveAvatarUrl(activeChat.userImage)} alt={activeChat.userName} />
                  <AvatarFallback className="text-xs">
                    {(activeChat.userName ?? "?").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm font-semibold">{activeChat.userName}</span>
              </Link>
            ) : (
              <span className="text-sm font-semibold">Диалог</span>
            )}
          </>
        ) : (
          <span className="flex-1 text-sm font-semibold">Сообщения</span>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Свернуть сообщения"
          className="ml-auto rounded-full p-1 hover:bg-accent"
        >
          <X className="size-4" />
        </button>
      </header>

      {activeChatId !== null ? (
        <DockConversation chatId={activeChatId} />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {chatsQuery.isPending &&
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-3 py-2">
                <Skeleton className="size-11 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}

          {chatsQuery.isError && (
            <p className="py-16 text-center text-sm text-destructive">
              Не удалось загрузить диалоги
            </p>
          )}

          {!chatsQuery.isPending && !chatsQuery.isError && chats.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">Диалогов пока нет</p>
          )}

          {chats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              onClick={() => setActiveChatId(chat.id)}
              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent"
            >
              <Avatar className="size-11 shrink-0">
                <AvatarImage src={resolveAvatarUrl(chat.userImage)} alt={chat.userName} />
                <AvatarFallback>{(chat.userName ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{chat.userName}</p>
                <p
                  className={cn(
                    "truncate text-xs",
                    chat.unreadCount > 0
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {chat.lastMessage ?? "Нет сообщений"}
                  {chat.lastMessageDate && (
                    <span className="text-muted-foreground">
                      {" · "}
                      {formatDistanceToNowStrict(new Date(chat.lastMessageDate), {
                        locale: ru,
                        addSuffix: false,
                      })}
                    </span>
                  )}
                </p>
              </div>
              {chat.unreadCount > 0 && (
                <span className="size-2.5 shrink-0 rounded-full bg-primary" aria-label="Непрочитанные" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Компактное окно переписки внутри дока: те же сообщения и поле ввода, что и на
// экране /messages, — переиспользуем MessageBubble и MessageForm. useChat поллит
// сообщения (3с), пока диалог открыт.
function DockConversation({ chatId }: { chatId: number }) {
  const chatQuery = useChat(chatId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = chatQuery.data?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {chatQuery.isPending &&
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-2/3" />
          ))}

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
    </>
  );
}
