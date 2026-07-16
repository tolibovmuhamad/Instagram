"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBlockedIds, useBlockUser, useUnblockUser } from "@/features/block/hooks";

interface ProfileOptionsMenuProps {
  userId: string;
  userName: string;
}

// Меню «…» на чужом профиле: блокировка/разблокировка. Блокировка — через
// подтверждающую модалку, как в Instagram. Статус берём из get-blocked-users.
export function ProfileOptionsMenu({ userId, userName }: ProfileOptionsMenuProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data: blockedIds } = useBlockedIds();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();

  const isBlocked = blockedIds?.has(userId) ?? false;

  const handleBlock = () => {
    blockUser.mutate(userId, { onSuccess: () => setConfirmOpen(false) });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Ещё"
              className="text-foreground/90 transition-colors hover:text-foreground"
            />
          }
        >
          <MoreHorizontal className="size-6" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-2xl p-0">
          {isBlocked ? (
            <DropdownMenuItem
              className="cursor-pointer justify-center px-4 py-3.5 text-[15px] font-semibold"
              onClick={() => unblockUser.mutate(userId)}
            >
              Разблокировать
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer justify-center px-4 py-3.5 text-[15px] font-semibold"
              onClick={() => setConfirmOpen(true)}
            >
              Заблокировать
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Заблокировать {userName}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {userName} не сможет находить ваш профиль, публикации и историю в Instagram. Instagram
            не сообщит пользователю, что вы его заблокировали.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={blockUser.isPending}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleBlock}
              disabled={blockUser.isPending}
            >
              {blockUser.isPending ? "Блокируем…" : "Заблокировать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
