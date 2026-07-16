"use client";

import { Switch } from "@/components/ui/switch";
import { useSettingsPrefs } from "@/store/settings-prefs";

import { PanelIntro, SettingRow } from "./_shared";

export function LikeCountsPanel() {
  const hideLikeCounts = useSettingsPrefs((state) => state.hideLikeCounts);
  const setHideLikeCounts = useSettingsPrefs((state) => state.setHideLikeCounts);

  return (
    <div className="max-w-2xl">
      <PanelIntro>
        Скройте число отметок «Нравится» и репостов на публикациях. Вы по-прежнему сможете видеть,
        кому понравилась ваша публикация, открыв список.
      </PanelIntro>

      <SettingRow
        title='Скрыть число отметок "Нравится" и репостов'
        description="Число реакций будет скрыто на публикациях других людей и на ваших собственных."
        control={
          <Switch
            checked={hideLikeCounts}
            aria-label='Скрыть число отметок "Нравится"'
            onCheckedChange={setHideLikeCounts}
          />
        }
      />
    </div>
  );
}
