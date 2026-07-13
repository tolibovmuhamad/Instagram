"use client";

import { useState } from "react";
import { Send } from "lucide-react";

import { NewChatDialog } from "./NewChatDialog";

// Пустое состояние правой панели «Сообщений» — как экран «Ваши сообщения» в Instagram.
export function MessagesEmptyState() {
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="grid size-24 place-items-center rounded-full border-2 border-foreground">
        <Send className="size-11 -rotate-6" strokeWidth={1.25} />
      </div>
      <h2 className="mt-5 text-xl">Ваши сообщения</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Отправляйте личные фото и сообщения другу или группе
      </p>
      <button
        type="button"
        onClick={() => setIsNewChatOpen(true)}
        className="mt-5 rounded-lg bg-[#0095f6] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#1877f2]"
      >
        Отправить сообщение
      </button>

      <NewChatDialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen} />
    </div>
  );
}
