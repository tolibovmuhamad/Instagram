"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { BadgeCheck, Search, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchUsers } from "@/features/users/hooks";
import type { UserSearchResult } from "@/features/users/types";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/lib/utils/image";

/** Заголовок + пояснение в верхней части панели. */
export function PanelIntro({ children }: { children: ReactNode }) {
  return <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

/** Строка «подпись + описание слева, контрол справа» — базовый блок настроек. */
export function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

/** Строка пользователя со ссылкой на профиль и произвольным действием справа. */
export function UserRow({
  user,
  action,
}: {
  user: Pick<UserSearchResult, "id" | "userName" | "fullName" | "avatar" | "isVerified">;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Link href={`/profile/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="size-11">
          <AvatarImage src={resolveAvatarUrl(user.avatar)} alt={user.userName} />
          <AvatarFallback>{user.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-sm font-medium">
            {user.userName}
            {user.isVerified && <BadgeCheck className="size-3.5 shrink-0 text-[#0095F6]" />}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.fullName}</p>
        </div>
      </Link>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface AddUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** id-набор уже добавленных — для них показываем состояние «Добавлено». */
  selectedIds: Set<string>;
  onPick: (user: UserSearchResult) => void;
  actionLabel?: string;
  addedLabel?: string;
}

/** Диалог поиска пользователей для добавления в список (близкие друзья / блок / …). */
export function AddUsersDialog({
  open,
  onOpenChange,
  title,
  selectedIds,
  onPick,
  actionLabel = "Добавить",
  addedLabel = "Добавлено",
}: AddUsersDialogProps) {
  const [query, setQuery] = useState("");
  const search = useSearchUsers(query);
  const results = search.data?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск"
            aria-label="Поиск пользователей"
            className="h-10 w-full rounded-lg bg-muted pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="max-h-80 overflow-y-auto">
          {search.isFetching && (
            <div className="space-y-3 py-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="size-11 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          )}

          {!search.isFetching && query.trim().length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Начните вводить имя пользователя
            </p>
          )}

          {!search.isFetching && query.trim().length > 0 && results.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Никого не найдено</p>
          )}

          {results.map((user) => {
            const added = selectedIds.has(user.id);
            return (
              <UserRow
                key={user.id}
                user={user}
                action={
                  <Button
                    type="button"
                    size="sm"
                    variant={added ? "secondary" : "default"}
                    disabled={added}
                    onClick={() => onPick(user)}
                  >
                    {added ? addedLabel : actionLabel}
                  </Button>
                }
              />
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Пустое состояние списка с иконкой и текстом. */
export function EmptyState({ icon: Icon, text }: { icon: typeof X; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Icon className="size-9 text-muted-foreground" strokeWidth={1.5} />
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

/** Общая обёртка вокруг списка с состояниями loading/error. */
export function ListStates({
  isPending,
  isError,
  errorText = "Не удалось загрузить список",
}: {
  isPending: boolean;
  isError: boolean;
  errorText?: string;
}) {
  if (isPending) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (isError) {
    return <p className={cn("py-10 text-center text-sm text-destructive")}>{errorText}</p>;
  }
  return null;
}
