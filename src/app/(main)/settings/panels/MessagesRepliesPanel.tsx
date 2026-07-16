"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { usePrivacySettings, useUpdatePrivacySettings } from "@/features/settings/hooks";
import {
  WHO_CAN_MESSAGE_OPTIONS,
  WHO_CAN_REPLY_STORY_OPTIONS,
} from "@/features/settings/types";

import { ChoiceSelect } from "./ChoiceSelect";
import { PanelIntro, SettingRow } from "./_shared";

export function MessagesRepliesPanel() {
  const { data, isPending, isError } = usePrivacySettings();
  const update = useUpdatePrivacySettings();

  if (isPending) return <Skeleton className="h-32 w-full max-w-md" />;
  if (isError || !data)
    return <p className="py-10 text-sm text-destructive">Не удалось загрузить настройки</p>;

  return (
    <div className="max-w-2xl">
      <PanelIntro>
        Выберите, кто может отправлять вам сообщения и отвечать на ваши истории.
      </PanelIntro>

      <SettingRow
        title="Кто может отправлять вам сообщения"
        control={
          <ChoiceSelect
            ariaLabel="Кто может отправлять вам сообщения"
            value={data.whoCanMessage}
            options={WHO_CAN_MESSAGE_OPTIONS}
            disabled={update.isPending}
            onChange={(value) => update.mutate({ whoCanMessage: value })}
          />
        }
      />

      <SettingRow
        title="Кто может отвечать на ваши истории"
        control={
          <ChoiceSelect
            ariaLabel="Кто может отвечать на ваши истории"
            value={data.whoCanReplyStory}
            options={WHO_CAN_REPLY_STORY_OPTIONS}
            disabled={update.isPending}
            onChange={(value) => update.mutate({ whoCanReplyStory: value })}
          />
        }
      />
    </div>
  );
}
