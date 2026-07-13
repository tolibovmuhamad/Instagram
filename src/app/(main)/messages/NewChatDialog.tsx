"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateChat } from "@/features/chat/hooks";
import { useSearchUsers } from "@/features/users/hooks";
import { resolveImageUrl } from "@/lib/utils/image";

const DEBOUNCE_MS = 400;

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewChatDialog({ open, onOpenChange }: NewChatDialogProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const createChat = useCreateChat();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(inputValue.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const searchQuery = useSearchUsers(debouncedQuery);
  const results = searchQuery.data?.items ?? [];

  const handleSelect = (userId: string) => {
    createChat.mutate(userId, {
      onSuccess: (chatId) => {
        onOpenChange(false);
        setInputValue("");
        router.push(`/messages/${chatId}`);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Новое сообщение</DialogTitle>
        </DialogHeader>

        <Input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Введите имя пользователя"
          aria-label="Поиск пользователя"
          autoFocus
        />

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {debouncedQuery && searchQuery.isPending &&
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-2">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}

          {debouncedQuery && !searchQuery.isPending && results.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">Никого не найдено</p>
          )}

          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelect(user.id)}
              disabled={createChat.isPending}
              className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted"
            >
              <Avatar className="size-10">
                <AvatarImage src={resolveImageUrl(user.avatar)} alt={user.userName} />
                <AvatarFallback>{user.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user.userName}</p>
                <p className="text-xs text-muted-foreground">{user.fullName}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
