"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { usePrivacySettings, useUpdatePrivacySettings } from "@/features/settings/hooks";

import { PanelIntro, SettingRow } from "./_shared";

export function StoryLocationPanel() {
  const { data, isPending, isError } = usePrivacySettings();
  const update = useUpdatePrivacySettings();

  if (isPending) return <Skeleton className="h-24 w-full max-w-md" />;
  if (isError || !data)
    return <p className="py-10 text-sm text-destructive">Не удалось загрузить настройки</p>;

  return (
    <div className="max-w-2xl">
      <PanelIntro>
        Управляйте тем, видят ли другие люди, когда вы в сети. Если статус активности
        выключен, вы также не будете видеть его у других.
      </PanelIntro>

      <SettingRow
        title="Показывать статус активности"
        description="Разрешить аккаунтам, с которыми вы переписываетесь, видеть, когда вы были в сети."
        control={
          <Switch
            checked={data.showOnlineStatus}
            disabled={update.isPending}
            aria-label="Показывать статус активности"
            onCheckedChange={(checked) => update.mutate({ showOnlineStatus: checked })}
          />
        }
      />
    </div>
  );
}
