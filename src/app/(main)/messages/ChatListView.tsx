"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Search, SquarePen, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useChats, useDeleteChat } from "@/features/chat/hooks";
import type { ChatSummary } from "@/features/chat/types";
import { getNoteBackground } from "@/features/notes/data";
import { useMyProfile } from "@/features/users/hooks";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";
import { useNotesStore } from "@/store/notes";

import { NewChatDialog } from "./NewChatDialog";
import { NoteComposer } from "./NoteComposer";

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
  const userName = useAuthStore((state) => state.user?.userName) ?? "Профиль";
  const myProfile = useMyProfile();
  const pathname = usePathname();
  const chatsQuery = useChats();
  const deleteChat = useDeleteChat();
  const myNote = useNotesStore((state) => (currentUserId ? state.notes[currentUserId] : undefined));
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [search, setSearch] = useState("");

  const chats = useMemo(() => chatsQuery.data ?? [], [chatsQuery.data]);

  const participants = useMemo(() => {
    const seen = new Set<string>();
    const list: { userId: string; userName: string; userImage: string | null }[] = [];
    for (const chat of chats) {
      const other = getOtherParticipant(chat, currentUserId);
      if (other.userId && !seen.has(other.userId)) {
        seen.add(other.userId);
        list.push(other);
      }
    }
    return list;
  }, [chats, currentUserId]);

  const filteredChats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return chats;
    return chats.filter((chat) =>
      getOtherParticipant(chat, currentUserId).userName.toLowerCase().includes(term),
    );
  }, [chats, currentUserId, search]);

  return (
    <div className="flex h-full flex-col">
      {/* Шапка: имя аккаунта + иконка нового сообщения. */}
      <div className="flex items-center justify-between px-6 pb-2 pt-5">
        <button type="button" className="flex items-center gap-1.5">
          <span className="text-xl font-bold tracking-tight">{userName}</span>
          <ChevronDown className="size-4" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          aria-label="Новое сообщение"
          onClick={() => setIsNewChatOpen(true)}
          className="transition-opacity hover:opacity-60"
        >
          <SquarePen className="size-6" strokeWidth={1.75} />
        </button>
      </div>

      {/* Поиск. */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск"
            aria-label="Поиск в сообщениях"
            className="h-10 w-full rounded-lg bg-muted pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Заметки: свой кружок «Ваша заметка» (создание) + участники диалогов. */}
      <div className="flex gap-4 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setIsNoteOpen(true)}
          className="flex w-16 shrink-0 flex-col items-center gap-1.5"
        >
          <div className="relative">
            {myNote ? (
              <span
                className="absolute -top-3 left-1/2 z-10 max-w-[84px] -translate-x-1/2 truncate rounded-2xl px-2 py-0.5 text-[10px] shadow-sm"
                style={{
                  background: getNoteBackground(myNote.background).style,
                  color: getNoteBackground(myNote.background).text === "light" ? "#fff" : undefined,
                }}
              >
                {myNote.text || myNote.music?.title || "♪"}
              </span>
            ) : (
              <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground shadow-sm">
                Что нового…
              </span>
            )}
            <Avatar className="size-14">
              <AvatarImage src={resolveImageUrl(myProfile.data?.image)} alt={userName} />
              <AvatarFallback>{userName.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <span className="max-w-full truncate text-xs text-muted-foreground">Ваша заметка</span>
        </button>

        {participants.slice(0, 10).map((user) => (
          <Link
            key={user.userId}
            href={`/profile/${user.userId}`}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5"
          >
            <Avatar className="size-14">
              <AvatarImage src={resolveImageUrl(user.userImage)} alt={user.userName} />
              <AvatarFallback>{user.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="max-w-full truncate text-xs">{user.userName}</span>
          </Link>
        ))}
      </div>

      {/* Заголовок раздела. */}
      <div className="flex items-center justify-between px-6 pb-1 pt-3">
        <h1 className="text-base font-bold">Сообщения</h1>
        <button type="button" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          Запросы
        </button>
      </div>

      {/* Список диалогов. */}
      <div className="flex-1 overflow-y-auto pb-2">
        {chatsQuery.isPending &&
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 px-6 py-2">
              <Skeleton className="size-14 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}

        {chatsQuery.isError && (
          <p className="py-16 text-center text-sm text-destructive">Не удалось загрузить диалоги</p>
        )}

        {!chatsQuery.isPending && !chatsQuery.isError && filteredChats.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {search ? "Ничего не найдено" : "Пока нет диалогов"}
          </p>
        )}

        {filteredChats.map((chat) => {
          const other = getOtherParticipant(chat, currentUserId);
          const isActive = pathname === `/messages/${chat.chatId}`;
          return (
            <div
              key={chat.chatId}
              className={cn(
                "group flex items-center gap-3 px-6 py-2 transition-colors hover:bg-muted",
                isActive && "bg-muted",
              )}
            >
              <Link href={`/messages/${chat.chatId}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar className="size-14">
                  <AvatarImage src={resolveImageUrl(other.userImage)} alt={other.userName} />
                  <AvatarFallback>{other.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="truncate text-sm font-medium">{other.userName}</span>
              </Link>
              <button
                type="button"
                aria-label="Удалить чат"
                onClick={() => deleteChat.mutate(chat.chatId)}
                className="grid size-8 shrink-0 place-items-center rounded-full opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
      </div>

      <NewChatDialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen} />
      {isNoteOpen && <NoteComposer onClose={() => setIsNoteOpen(false)} />}
    </div>
  );
}
