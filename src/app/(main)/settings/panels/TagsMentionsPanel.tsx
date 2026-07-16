"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { usePrivacySettings, useUpdatePrivacySettings } from "@/features/settings/hooks";
import { WHO_CAN_MENTION_OPTIONS } from "@/features/settings/types";

import { ChoiceSelect } from "./ChoiceSelect";
import { PanelIntro, SettingRow } from "./_shared";

export function TagsMentionsPanel() {
  const { data, isPending, isError } = usePrivacySettings();
  const update = useUpdatePrivacySettings();

  if (isPending) return <Skeleton className="h-24 w-full max-w-md" />;
  if (isError || !data)
    return <p className="py-10 text-sm text-destructive">Не удалось загрузить настройки</p>;

  return (
    <div className="max-w-2xl">
      <PanelIntro>
        Выберите, кто может упоминать вас в комментариях, подписях и историях с помощью @имя.
      </PanelIntro>

      <SettingRow
        title="Кто может упоминать вас"
        control={
          <ChoiceSelect
            ariaLabel="Кто может упоминать вас"
            value={data.whoCanMention}
            options={WHO_CAN_MENTION_OPTIONS}
            disabled={update.isPending}
            onChange={(value) => update.mutate({ whoCanMention: value })}
          />
        }
      />
    </div>
  );
}
