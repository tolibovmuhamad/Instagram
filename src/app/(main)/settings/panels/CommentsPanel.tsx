"use client";

import { useSettingsPrefs, type CommentAudience } from "@/store/settings-prefs";

import { ChoiceSelect } from "./ChoiceSelect";
import { PanelIntro, SettingRow } from "./_shared";

const AUDIENCE_OPTIONS: { value: CommentAudience; label: string }[] = [
  { value: "everyone", label: "Все" },
  { value: "followers", label: "Ваши подписчики" },
  { value: "following", label: "Люди, на которых вы подписаны" },
  { value: "off", label: "Отключить комментарии" },
];

export function CommentsPanel() {
  const allowComments = useSettingsPrefs((state) => state.allowComments);
  const setAllowComments = useSettingsPrefs((state) => state.setAllowComments);

  return (
    <div className="max-w-2xl">
      <PanelIntro>Выберите, кто может комментировать ваши публикации.</PanelIntro>

      <SettingRow
        title="Разрешить комментарии от"
        control={
          <ChoiceSelect
            ariaLabel="Разрешить комментарии от"
            value={allowComments}
            options={AUDIENCE_OPTIONS}
            onChange={setAllowComments}
          />
        }
      />
    </div>
  );
}
