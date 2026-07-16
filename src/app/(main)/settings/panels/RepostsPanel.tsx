"use client";

import { Switch } from "@/components/ui/switch";
import { useSettingsPrefs } from "@/store/settings-prefs";

import { PanelIntro, SettingRow } from "./_shared";

export function RepostsPanel() {
  const allowReposts = useSettingsPrefs((state) => state.allowReposts);
  const setAllowReposts = useSettingsPrefs((state) => state.setAllowReposts);

  return (
    <div className="max-w-2xl">
      <PanelIntro>
        Управляйте тем, могут ли другие люди делиться вашими публикациями в своих историях и
        повторно использовать ваш контент.
      </PanelIntro>

      <SettingRow
        title="Разрешить репосты в истории"
        description="Другие смогут добавлять ваши публикации к себе в истории."
        control={
          <Switch
            checked={allowReposts}
            aria-label="Разрешить репосты в истории"
            onCheckedChange={setAllowReposts}
          />
        }
      />
    </div>
  );
}
