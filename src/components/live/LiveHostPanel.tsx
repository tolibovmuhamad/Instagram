"use client";

import { Ban, Check, UserMinus, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useActiveGuests,
  useApproveGuest,
  useBanViewer,
  useDeclineGuest,
  useGuestRequests,
  useLiveViewers,
  useRemoveGuest,
} from "@/features/live/hooks";
import type { LiveUser } from "@/features/live/types";
import { resolveAvatarUrl } from "@/lib/utils/image";

function UserRow({ user, children }: { user: LiveUser; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-7 shrink-0">
        <AvatarImage src={resolveAvatarUrl(user.avatar)} alt={user.userName} />
        <AvatarFallback className="text-[10px]">
          {user.userName.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 truncate text-sm text-white">{user.userName}</span>
      <div className="flex shrink-0 items-center gap-1">{children}</div>
    </div>
  );
}

const iconButtonClass = "rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white";

/** Управление эфиром — видно только хосту. */
export function LiveHostPanel({ streamId }: { streamId: number }) {
  const requestsQuery = useGuestRequests(streamId, true);
  const guestsQuery = useActiveGuests(streamId);
  const viewersQuery = useLiveViewers(streamId, true);

  const approve = useApproveGuest(streamId);
  const decline = useDeclineGuest(streamId);
  const removeGuest = useRemoveGuest(streamId);
  const ban = useBanViewer(streamId);

  // Сервер отдаёт и обработанные заявки — в очереди показываем только ожидающие.
  const pending = (requestsQuery.data ?? []).filter((r) => r.status === "Pending");
  const guests = guestsQuery.data ?? [];
  const viewers = viewersQuery.data?.items ?? [];

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-white/60 uppercase">
          Заявки в гости {pending.length > 0 && `(${pending.length})`}
        </h3>
        {pending.length === 0 ? (
          <p className="text-sm text-white/50">Заявок нет.</p>
        ) : (
          <div className="space-y-2">
            {pending.map((request) => (
              <UserRow key={request.requestId} user={request.user}>
                <button
                  type="button"
                  aria-label={`Одобрить заявку: ${request.user.userName}`}
                  onClick={() => approve.mutate(request.requestId)}
                  className={iconButtonClass}
                >
                  <Check className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Отклонить заявку: ${request.user.userName}`}
                  onClick={() => decline.mutate(request.requestId)}
                  className={iconButtonClass}
                >
                  <X className="size-4" />
                </button>
              </UserRow>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-white/60 uppercase">
          Гости в эфире {guests.length > 0 && `(${guests.length})`}
        </h3>
        {guests.length === 0 ? (
          <p className="text-sm text-white/50">Никого не пригласили.</p>
        ) : (
          <div className="space-y-2">
            {guests.map((guest) => (
              <UserRow key={guest.userId} user={guest}>
                <button
                  type="button"
                  aria-label={`Убрать из эфира: ${guest.userName}`}
                  onClick={() => removeGuest.mutate(guest.userId)}
                  className={iconButtonClass}
                >
                  <UserMinus className="size-4" />
                </button>
              </UserRow>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-white/60 uppercase">
          Смотрят сейчас {viewers.length > 0 && `(${viewersQuery.data?.totalRecords ?? viewers.length})`}
        </h3>
        {viewers.length === 0 ? (
          <p className="text-sm text-white/50">Пока никто не смотрит.</p>
        ) : (
          <div className="space-y-2">
            {viewers.map((viewer) => (
              <UserRow key={viewer.user.userId} user={viewer.user}>
                <button
                  type="button"
                  aria-label={`Забанить: ${viewer.user.userName}`}
                  onClick={() => ban.mutate(viewer.user.userId)}
                  className={iconButtonClass}
                >
                  <Ban className="size-4" />
                </button>
              </UserRow>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
