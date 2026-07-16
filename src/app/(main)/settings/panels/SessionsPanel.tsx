"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { ru } from "date-fns/locale";
import { Monitor, MonitorSmartphone, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useActiveSessions,
  useRevokeAllOtherSessions,
  useRevokeSession,
} from "@/features/sessions/hooks";
import type { ActiveSession } from "@/features/sessions/types";

import { EmptyState, ListStates, PanelIntro } from "./_shared";

// deviceType — свободная строка от бэкенда (выводится из User-Agent), а не enum.
// Проверено запросами к API: значений всего три — "Web", "Mobile" и "Unknown"
// (планшет бэкенд тоже относит к Mobile). Незнакомое показываем нейтральной иконкой.
const DEVICE_ICONS: Record<string, LucideIcon> = {
  web: Monitor,
  mobile: Smartphone,
};

/**
 * Заголовок строки. Бэкенд сам собирает deviceName уже по-русски («Chrome на Windows»),
 * поэтому берём его; склейка браузер+ОС — запасной путь, если имени нет.
 */
function sessionTitle(session: ActiveSession): string {
  if (session.deviceName && session.deviceName.toLowerCase() !== "unknown") {
    return session.deviceName;
  }
  const parts = [session.browser, session.os].filter(
    (part): part is string => !!part && part.toLowerCase() !== "unknown",
  );
  return parts.length > 0 ? parts.join(" · ") : "Неизвестное устройство";
}

/** Подпись: где и когда. Пустые поля просто пропускаем, а не пишем «null». */
function sessionSubtitle(session: ActiveSession): string {
  const parts: string[] = [];
  if (session.location) parts.push(session.location);
  if (session.ipAddress) parts.push(session.ipAddress);
  parts.push(`активность ${formatDistanceToNowStrict(new Date(session.lastActivityAt), {
    locale: ru,
    addSuffix: true,
  })}`);
  return parts.join(" · ");
}

function SessionRow({ session }: { session: ActiveSession }) {
  const revoke = useRevokeSession();
  const Icon = DEVICE_ICONS[session.deviceType?.toLowerCase() ?? ""] ?? MonitorSmartphone;

  return (
    <div className="flex items-center gap-4 py-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5" strokeWidth={1.75} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-medium">
          {sessionTitle(session)}
          {session.isCurrent && (
            <span className="shrink-0 rounded-full bg-[#0095F6]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0095F6]">
              Это устройство
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {sessionSubtitle(session)}
        </p>
      </div>

      {/* Текущую сессию завершить нельзя — для выхода из неё есть кнопка «Выйти». */}
      {!session.isCurrent && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="shrink-0"
          disabled={revoke.isPending}
          onClick={() => revoke.mutate(session.id)}
        >
          Завершить
        </Button>
      )}
    </div>
  );
}

export function SessionsPanel() {
  const query = useActiveSessions();
  const revokeAll = useRevokeAllOtherSessions();

  const sessions = query.data ?? [];
  const hasOthers = sessions.some((session) => !session.isCurrent);

  return (
    <div className="max-w-2xl">
      <PanelIntro>
        Здесь показаны устройства, на которых сейчас выполнен вход в ваш аккаунт. Если вы не
        узнаёте какое-то из них, завершите сеанс и смените пароль.
      </PanelIntro>

      {hasOthers && (
        <Button
          type="button"
          className="mb-2"
          disabled={revokeAll.isPending}
          onClick={() => revokeAll.mutate()}
        >
          Завершить все остальные сеансы
        </Button>
      )}

      <ListStates
        isPending={query.isPending}
        isError={query.isError}
        errorText="Не удалось загрузить активные сеансы"
      />

      {query.isSuccess && sessions.length === 0 && (
        <EmptyState icon={MonitorSmartphone} text="Активных сеансов не найдено." />
      )}

      <div className="divide-y">
        {sessions.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
}
