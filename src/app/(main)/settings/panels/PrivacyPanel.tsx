"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { usePrivacySettings, useUpdatePrivacySettings } from "@/features/settings/hooks";

import { PanelIntro, SettingRow } from "./_shared";

export function PrivacyPanel() {
  const { data, isPending, isError } = usePrivacySettings();
  const update = useUpdatePrivacySettings();

  if (isPending) return <Skeleton className="h-24 w-full max-w-md" />;
  if (isError || !data)
    return <p className="py-10 text-sm text-destructive">Не удалось загрузить настройки</p>;

  return (
    <div className="max-w-2xl">
      <PanelIntro>
        Когда ваш аккаунт закрыт, ваши публикации и истории видят только одобренные вами
        подписчики. Это не влияет на подписчиков, которые у вас уже есть.
      </PanelIntro>

      <SettingRow
        title="Закрытый аккаунт"
        description="Новым подписчикам сначала нужно отправить запрос на подписку."
        control={
          <Switch
            checked={data.isPrivate}
            disabled={update.isPending}
            aria-label="Закрытый аккаунт"
            onCheckedChange={(checked) => update.mutate({ isPrivate: checked })}
          />
        }
      />
    </div>
  );
}
