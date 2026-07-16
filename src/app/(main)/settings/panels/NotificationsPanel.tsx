"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { useUnreadNotificationCount } from "@/features/notifications/hooks";
import { useSettingsPrefs, type NotificationPrefs } from "@/store/settings-prefs";

import { PanelIntro, SettingRow } from "./_shared";

const ROWS: { key: keyof NotificationPrefs; title: string; description: string }[] = [
  { key: "likes", title: 'Отметки "Нравится"', description: "Когда кто-то оценил вашу публикацию." },
  { key: "comments", title: "Комментарии", description: "Когда кто-то комментирует ваши публикации." },
  { key: "follows", title: "Новые подписчики", description: "Когда кто-то подписывается на вас." },
  { key: "mentions", title: "Упоминания", description: "Когда вас упоминают в комментарии или подписи." },
  { key: "messages", title: "Личные сообщения", description: "Новые сообщения в директе." },
  { key: "storyReplies", title: "Ответы на истории", description: "Когда кто-то отвечает на вашу историю." },
];

export function NotificationsPanel() {
  const prefs = useSettingsPrefs((state) => state.notifications);
  const setNotification = useSettingsPrefs((state) => state.setNotification);
  const unread = useUnreadNotificationCount();

  const paused = prefs.pauseAll;

  return (
    <div className="max-w-2xl">
      <PanelIntro>
        Управляйте тем, о чём вас уведомлять. Сами уведомления (лайки, подписки, комментарии)
        приходят с сервера — открыть их можно на странице уведомлений.
      </PanelIntro>

      <Link
        href="/notifications"
        className="mb-4 flex items-center justify-between rounded-xl border px-4 py-3 transition-colors hover:bg-muted"
      >
        <span className="text-sm font-medium">
          Открыть уведомления
          {(unread.data ?? 0) > 0 && (
            <span className="ml-2 rounded-full bg-[#FF3040] px-2 py-0.5 text-xs font-semibold text-white">
              {unread.data}
            </span>
          )}
        </span>
        <ArrowRight className="size-4 text-muted-foreground" />
      </Link>

      <SettingRow
        title="Приостановить все"
        description="Временно отключить push-уведомления этого раздела."
        control={
          <Switch
            checked={paused}
            aria-label="Приостановить все уведомления"
            onCheckedChange={(checked) => setNotification("pauseAll", checked)}
          />
        }
      />

      {ROWS.map((row) => (
        <SettingRow
          key={row.key}
          title={row.title}
          description={row.description}
          control={
            <Switch
              checked={!paused && prefs[row.key]}
              disabled={paused}
              aria-label={row.title}
              onCheckedChange={(checked) => setNotification(row.key, checked)}
            />
          }
        />
      ))}
    </div>
  );
}
