"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Star } from "lucide-react";
import { useInView } from "react-intersection-observer";

import { Button } from "@/components/ui/button";
import {
  useAddCloseFriend,
  useCloseFriendsInfinite,
  useRemoveCloseFriend,
} from "@/features/close-friends/hooks";

import { AddUsersDialog, EmptyState, ListStates, PanelIntro, UserRow } from "./_shared";

export function CloseFriendsPanel() {
  const query = useCloseFriendsInfinite();
  const add = useAddCloseFriend();
  const remove = useRemoveCloseFriend();
  const [dialogOpen, setDialogOpen] = useState(false);

  const users = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );
  const ids = useMemo(() => new Set(users.map((u) => u.id)), [users]);

  const { ref, inView } = useInView();
  useEffect(() => {
    if (inView && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [inView, query]);

  return (
    <div className="max-w-2xl">
      <PanelIntro>
        Списком близких друзей делиться нельзя, и никто не узнаёт, что находится в нём. Публикуя
        историю только для близких друзей, вы показываете её лишь людям из этого списка.
      </PanelIntro>

      <Button type="button" className="mb-2" onClick={() => setDialogOpen(true)}>
        <Plus className="size-4" />
        Добавить близких друзей
      </Button>

      <ListStates isPending={query.isPending} isError={query.isError} />

      {query.isSuccess && users.length === 0 && (
        <EmptyState icon={Star} text="Вы пока не добавили никого в близкие друзья." />
      )}

      <div className="divide-y">
        {users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            action={
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={remove.isPending}
                onClick={() => remove.mutate(user.id)}
              >
                Удалить
              </Button>
            }
          />
        ))}
      </div>

      {query.hasNextPage && <div ref={ref} className="h-px" />}

      <AddUsersDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Близкие друзья"
        selectedIds={ids}
        onPick={(user) => add.mutate(user.id)}
      />
    </div>
  );
}
