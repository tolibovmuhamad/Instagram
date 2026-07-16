"use client";

import { CircleSlash2 } from "lucide-react";

import { useSettingsPrefs } from "@/store/settings-prefs";

import { LocalUserListPanel } from "./LocalUserListPanel";

export function RestrictedPanel() {
  const users = useSettingsPrefs((state) => state.restrictedUsers);
  const toggle = useSettingsPrefs((state) => state.toggleRestricted);

  return (
    <LocalUserListPanel
      users={users}
      onToggle={toggle}
      addLabel="Ограничить аккаунт"
      dialogTitle="Ограничить аккаунт"
      removeLabel="Снять ограничение"
      emptyIcon={CircleSlash2}
      emptyText="Вы не ограничили ни одного аккаунта."
      intro="Комментарии от аккаунтов с ограничениями будут видны только им, пока вы их не одобрите. Такие аккаунты не увидят, в сети ли вы и прочитали ли вы их сообщения."
    />
  );
}
