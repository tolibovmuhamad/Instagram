"use client";

import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useChats, useForwardMessage } from "@/features/chat/hooks";
import { resolveAvatarUrl } from "@/lib/utils/image";

interface ForwardDialogProps {
  messageId: number | null;
  // Чат-источник, чтобы не предлагать переслать сообщение в него же.
  fromChatId: number;
  onOpenChange: (open: boolean) => void;
}

export function ForwardDialog({ messageId, fromChatId, onOpenChange }: ForwardDialogProps) {
  const chatsQuery = useChats();
  const forward = useForwardMessage();
  const chats = (chatsQuery.data ?? []).filter((chat) => chat.id !== fromChatId);

  const handleSelect = (targetChatId: number) => {
    if (messageId == null) return;
    forward.mutate(
      { messageId, targetChatId },
      {
        onSuccess: () => {
          toast.success("Сообщение переслано");
          onOpenChange(false);
        },
        onError: () => toast.error("Не удалось переслать сообщение"),
      },
    );
  };

  return (
    <Dialog open={messageId != null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Переслать</DialogTitle>
        </DialogHeader>

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {chatsQuery.isPending &&
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-2">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}

          {!chatsQuery.isPending && chats.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">Нет других диалогов</p>
          )}

          {chats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              onClick={() => handleSelect(chat.id)}
              disabled={forward.isPending}
              className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted disabled:opacity-50"
            >
              <Avatar className="size-10">
                <AvatarImage src={resolveAvatarUrl(chat.userImage)} alt={chat.userName} />
                <AvatarFallback>{chat.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium">{chat.userName}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
