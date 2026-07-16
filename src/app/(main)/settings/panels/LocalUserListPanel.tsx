"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { UserSearchResult } from "@/features/users/types";
import type { LocalUser } from "@/store/settings-prefs";

import { AddUsersDialog, EmptyState, PanelIntro, UserRow } from "./_shared";

interface LocalUserListPanelProps {
  intro: ReactNode;
  addLabel: string;
  dialogTitle: string;
  removeLabel: string;
  emptyIcon: LucideIcon;
  emptyText: string;
  users: LocalUser[];
  onToggle: (user: LocalUser) => void;
}

function toLocalUser(user: UserSearchResult): LocalUser {
  return {
    id: user.id,
    userName: user.userName,
    fullName: user.fullName,
    avatar: user.avatar,
    isVerified: user.isVerified,
  };
}

// Общая панель для локальных (без бэкенда) списков пользователей: «Скрытые» и
// «Ограниченные» аккаунты. Список хранится в settings-prefs и переживает перезагрузку.
export function LocalUserListPanel({
  intro,
  addLabel,
  dialogTitle,
  removeLabel,
  emptyIcon,
  emptyText,
  users,
  onToggle,
}: LocalUserListPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const ids = useMemo(() => new Set(users.map((u) => u.id)), [users]);

  return (
    <div className="max-w-2xl">
      <PanelIntro>{intro}</PanelIntro>

      <Button type="button" className="mb-2" onClick={() => setDialogOpen(true)}>
        <Plus className="size-4" />
        {addLabel}
      </Button>

      {users.length === 0 && <EmptyState icon={emptyIcon} text={emptyText} />}

      <div className="divide-y">
        {users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            action={
              <Button type="button" size="sm" variant="secondary" onClick={() => onToggle(user)}>
                {removeLabel}
              </Button>
            }
          />
        ))}
      </div>

      <AddUsersDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogTitle}
        selectedIds={ids}
        onPick={(user) => onToggle(toLocalUser(user))}
      />
    </div>
  );
}
