"use client";

import Image from "next/image";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDeleteMessage } from "@/features/chat/hooks";
import type { ChatMessage } from "@/features/chat/types";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

export function MessageBubble({ message, chatId }: { message: ChatMessage; chatId: number }) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const deleteMessage = useDeleteMessage(chatId);
  const isOwn = message.userId === currentUserId;
  const fileUrl = resolveImageUrl(message.file);

  return (
    <div className={cn("group flex items-end gap-1", isOwn ? "justify-end" : "justify-start")}>
      {isOwn && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6 opacity-0 group-hover:opacity-100"
          aria-label="Удалить сообщение"
          onClick={() => deleteMessage.mutate(message.messageId)}
        >
          <Trash2 className="size-3" />
        </Button>
      )}
      <div
        className={cn(
          "max-w-[75%] space-y-1 rounded-2xl px-3 py-2 text-sm",
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {fileUrl && (
          <Image src={fileUrl} alt="" width={200} height={200} className="rounded-lg object-cover" />
        )}
        {message.messageText && <p>{message.messageText}</p>}
        <p className="text-[10px] opacity-70">
          {format(new Date(message.sendMassageDate), "HH:mm", { locale: ru })}
        </p>
      </div>
    </div>
  );
}
