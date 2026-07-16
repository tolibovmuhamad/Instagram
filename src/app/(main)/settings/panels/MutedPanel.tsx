"use client";

import { BellOff } from "lucide-react";

import { useSettingsPrefs } from "@/store/settings-prefs";

import { LocalUserListPanel } from "./LocalUserListPanel";

export function MutedPanel() {
  const users = useSettingsPrefs((state) => state.mutedUsers);
  const toggle = useSettingsPrefs((state) => state.toggleMuted);

  return (
    <LocalUserListPanel
      users={users}
      onToggle={toggle}
      addLabel="Скрыть аккаунт"
      dialogTitle="Скрыть аккаунт"
      removeLabel="Показывать"
      emptyIcon={BellOff}
      emptyText="Вы не скрывали публикации и истории ни у одного аккаунта."
      intro="Вы не будете видеть публикации и истории скрытых аккаунтов в своей ленте. Они не узнают, что вы их скрыли."
    />
  );
}
