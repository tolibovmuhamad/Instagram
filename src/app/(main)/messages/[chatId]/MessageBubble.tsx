"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Forward, SmilePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteMessage, useReactToMessage } from "@/features/chat/hooks";
import type { ChatMessage } from "@/features/chat/types";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

import { ForwardDialog } from "./ForwardDialog";
import { VoiceMessage } from "./VoiceMessage";

// Быстрые реакции, как в Instagram Direct.
const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

interface GroupedReaction {
  emoji: string;
  count: number;
  mine: boolean;
}

function groupReactions(
  reactions: ChatMessage["reactions"],
  currentUserId: string | undefined,
): GroupedReaction[] {
  const map = new Map<string, GroupedReaction>();
  for (const reaction of reactions) {
    const entry = map.get(reaction.emoji) ?? { emoji: reaction.emoji, count: 0, mine: false };
    entry.count += 1;
    if (reaction.userId === currentUserId) entry.mine = true;
    map.set(reaction.emoji, entry);
  }
  return [...map.values()];
}

export function MessageBubble({ message, chatId }: { message: ChatMessage; chatId: number }) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const deleteMessage = useDeleteMessage(chatId);
  const reactToMessage = useReactToMessage(chatId);
  const [forwardOpen, setForwardOpen] = useState(false);

  const isOwn = message.senderUserId === currentUserId;
  const fileUrl = resolveImageUrl(message.fileName);
  const isVoice = message.messageType === 1;
  const reactions = groupReactions(message.reactions ?? [], currentUserId);

  const actions = (
    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="ghost" size="icon" className="size-6" aria-label="Реакция" />
          }
        >
          <SmilePlus className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isOwn ? "end" : "start"} className="w-auto min-w-0">
          <div className="flex gap-0.5">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="rounded-md px-1.5 py-1 text-lg leading-none hover:bg-accent"
                onClick={() => reactToMessage.mutate({ messageId: message.id, emoji })}
              >
                {emoji}
              </button>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6"
        aria-label="Переслать сообщение"
        onClick={() => setForwardOpen(true)}
      >
        <Forward className="size-3.5" />
      </Button>

      {isOwn && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6"
          aria-label="Удалить сообщение"
          onClick={() => deleteMessage.mutate(message.id)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className={cn("group flex items-end gap-1", isOwn ? "justify-end" : "justify-start")}>
        {isOwn && actions}

        <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
          <div
            className={cn(
              "max-w-[75%] space-y-1 rounded-2xl px-3 py-2 text-sm",
              isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            {message.isForwarded && (
              <p className="flex items-center gap-1 text-[10px] italic opacity-70">
                <Forward className="size-3" /> Переслано
              </p>
            )}

            {isVoice && fileUrl ? (
              <VoiceMessage
                src={fileUrl}
                duration={message.duration}
                waveform={message.waveform}
                isOwn={isOwn}
              />
            ) : (
              <>
                {fileUrl && (
                  <Image
                    src={fileUrl}
                    alt=""
                    width={200}
                    height={200}
                    className="rounded-lg object-cover"
                  />
                )}
                {message.messageText && <p>{message.messageText}</p>}
              </>
            )}
            <p className="text-[10px] opacity-70">
              {format(new Date(message.createdAt), "HH:mm", { locale: ru })}
            </p>
          </div>

          {reactions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  type="button"
                  onClick={() =>
                    reactToMessage.mutate({ messageId: message.id, emoji: reaction.emoji })
                  }
                  className={cn(
                    "flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs",
                    reaction.mine ? "border-primary bg-primary/10" : "border-border bg-background",
                  )}
                >
                  <span className="leading-none">{reaction.emoji}</span>
                  {reaction.count > 1 && (
                    <span className="text-[10px] tabular-nums opacity-70">{reaction.count}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {!isOwn && actions}
      </div>

      <ForwardDialog
        messageId={forwardOpen ? message.id : null}
        fromChatId={chatId}
        onOpenChange={setForwardOpen}
      />
    </>
  );
}
