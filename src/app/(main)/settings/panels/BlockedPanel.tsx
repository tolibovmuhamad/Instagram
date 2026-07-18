"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, Plus } from "lucide-react";
import { useInView } from "react-intersection-observer";

import { Button } from "@/components/ui/button";
import { useBlockedUsersInfinite, useBlockUser, useUnblockUser } from "@/features/block/hooks";
import { dedupeById } from "@/lib/utils/dedupe";

import { AddUsersDialog, EmptyState, ListStates, PanelIntro, UserRow } from "./_shared";

export function BlockedPanel() {
  const query = useBlockedUsersInfinite();
  const block = useBlockUser();
  const unblock = useUnblockUser();
  const [dialogOpen, setDialogOpen] = useState(false);

  const users = useMemo(
    () => dedupeById(query.data?.pages.flatMap((page) => page.items) ?? []),
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
        Заблокированные люди не смогут находить ваш профиль, публикации и истории. Instagram не
        сообщит им, что вы их заблокировали.
      </PanelIntro>

      <Button type="button" className="mb-2" onClick={() => setDialogOpen(true)}>
        <Plus className="size-4" />
        Заблокировать аккаунт
      </Button>

      <ListStates isPending={query.isPending} isError={query.isError} />

      {query.isSuccess && users.length === 0 && (
        <EmptyState icon={Ban} text="Вы никого не заблокировали." />
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
                disabled={unblock.isPending}
                onClick={() => unblock.mutate(user.id)}
              >
                Разблокировать
              </Button>
            }
          />
        ))}
      </div>

      {query.hasNextPage && <div ref={ref} className="h-px" />}

      <AddUsersDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Заблокировать аккаунт"
        selectedIds={ids}
        actionLabel="Заблокировать"
        addedLabel="Заблокирован"
        onPick={(user) => block.mutate(user.id)}
      />
    </div>
  );
}
