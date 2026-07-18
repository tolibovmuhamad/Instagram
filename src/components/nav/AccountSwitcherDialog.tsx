"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Check, LogOut, Plus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAccounts } from "@/features/auth/useAccounts";
import { MAX_ACCOUNTS } from "@/features/auth/types";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/lib/utils/image";

export function AccountSwitcherDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { accounts, activeUserId, canAddMore, switchTo, logoutOne, logoutAll } = useAccounts();
  // Пока идёт переключение/выход — блокируем список, чтобы не словить гонку кликов.
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const handleAddAccount = () => {
    onOpenChange(false);
    router.push("/login?add=1");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-sm">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Сменить аккаунт</DialogTitle>
          <DialogDescription className="sr-only">
            Выберите аккаунт для переключения, добавьте новый или выйдите из аккаунта.
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-[50vh] overflow-y-auto py-1" aria-busy={busy}>
          {accounts.map((account) => {
            const isActive = account.userId === activeUserId;
            return (
              <li key={account.userId}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5",
                    !isActive && "transition-colors hover:bg-accent",
                  )}
                >
                  <button
                    type="button"
                    disabled={busy || isActive}
                    onClick={() => run(() => switchTo(account.userId))}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default"
                    aria-current={isActive ? "true" : undefined}
                  >
                    <Avatar
                      className={cn(
                        "size-11 shrink-0",
                        isActive
                          ? "ring-2 ring-[#0095F6] ring-offset-2 ring-offset-background"
                          : "ring-1 ring-border",
                      )}
                    >
                      <AvatarImage
                        src={resolveAvatarUrl(account.avatar)}
                        alt={account.userName}
                      />
                      <AvatarFallback className="text-sm font-medium">
                        {(account.userName || "?").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1">
                        <span className="truncate text-sm font-semibold">
                          {account.userName}
                        </span>
                        {account.isVerified && (
                          <BadgeCheck className="size-3.5 shrink-0 text-[#0095F6]" />
                        )}
                      </span>
                      {account.fullName && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {account.fullName}
                        </span>
                      )}
                    </span>
                  </button>

                  {isActive ? (
                    <Check className="size-5 shrink-0 text-[#0095F6]" aria-label="Активный аккаунт" />
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={busy}
                      aria-label={`Выйти из аккаунта ${account.userName}`}
                      title="Выйти"
                      onClick={() => run(() => logoutOne(account.userId))}
                    >
                      <LogOut className="size-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-1 border-t p-2">
          <button
            type="button"
            onClick={handleAddAccount}
            disabled={!canAddMore || busy}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-[#0095F6] transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-dashed border-[#0095F6]/50">
              <Plus className="size-5" />
            </span>
            {canAddMore ? "Добавить аккаунт" : `Максимум ${MAX_ACCOUNTS} аккаунтов`}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                // Из активного аккаунта — обычный выход; когда он один, это и есть «Выйти».
                if (accounts.length > 1) await logoutAll();
                else if (activeUserId) await logoutOne(activeUserId);
              })
            }
            className="rounded-lg px-2 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
          >
            {accounts.length > 1 ? "Выйти из всех аккаунтов" : "Выйти"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
