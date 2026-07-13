"use client";

import { useRef, useState } from "react";
import { Paperclip, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSendMessage } from "@/features/chat/hooks";

export function MessageForm({ chatId }: { chatId: number }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendMessage = useSendMessage(chatId);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim() && !file) return;
    sendMessage.mutate(
      { chatId, messageText: text.trim() || undefined, file: file ?? undefined },
      {
        onSuccess: () => {
          setText("");
          setFile(null);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-3">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Прикрепить файл"
      >
        <Paperclip className="size-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <Input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={file ? file.name : "Сообщение…"}
        aria-label="Текст сообщения"
        className="flex-1"
      />
      <Button
        type="submit"
        size="icon"
        disabled={sendMessage.isPending || (!text.trim() && !file)}
        aria-label="Отправить"
      >
        <SendHorizontal className="size-4" />
      </Button>
    </form>
  );
}
