"use client";

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscribers, useSubscriptions } from "@/features/follows/hooks";
import { resolveAvatarUrl } from "@/lib/utils/image";

interface FollowListDialogProps {
  userId: string;
  mode: "subscribers" | "subscriptions";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FollowListDialog({ userId, mode, open, onOpenChange }: FollowListDialogProps) {
  const subscribersQuery = useSubscribers(mode === "subscribers" && open ? userId : "");
  const subscriptionsQuery = useSubscriptions(mode === "subscriptions" && open ? userId : "");

  const query = mode === "subscribers" ? subscribersQuery : subscriptionsQuery;
  const items = query.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "subscribers" ? "Подписчики" : "Подписки"}</DialogTitle>
        </DialogHeader>

        <div className="max-h-96 space-y-3 overflow-y-auto">
          {query.isPending &&
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}

          {query.isError && (
            <p className="py-6 text-center text-sm text-destructive">Не удалось загрузить список</p>
          )}

          {!query.isPending && !query.isError && items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Пусто</p>
          )}

          {items.map((item) => (
            <Link
              key={item.id}
              href={`/profile/${item.id}`}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3"
            >
              <Avatar className="size-10">
                <AvatarImage src={resolveAvatarUrl(item.avatar)} alt={item.userName} />
                <AvatarFallback>{item.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{item.userName}</p>
                <p className="text-xs text-muted-foreground">{item.fullName}</p>
              </div>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
