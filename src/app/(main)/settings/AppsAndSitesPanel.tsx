"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

const TABS = [
  { id: "active", label: "Активные" },
  { id: "expired", label: "Срок действия истек" },
  { id: "removed", label: "Удаленные" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const EMPTY_TEXT: Record<TabId, string> = {
  active: "Вы не предоставили доступ к вашему аккаунту Instagram ни одному приложению.",
  expired: "Нет приложений с истёкшим сроком действия.",
  removed: "Вы не удаляли доступ ни у одного приложения.",
};

// Правая панель «Приложения и сайты» — как в вебе Instagram: вкладки статусов и
// описание. Реального OAuth-каталога приложений у бэкенда нет, поэтому список пуст.
export function AppsAndSitesPanel() {
  const [tab, setTab] = useState<TabId>("active");

  return (
    <div>
      <div className="flex border-b">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={cn(
              "flex-1 border-b-2 pb-3 text-sm font-semibold transition-colors",
              tab === entry.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <p className="mt-8 max-w-2xl text-sm leading-relaxed">
        Здесь показываются приложения и сайты, которые вы подключили к своему аккаунту Instagram.
        У них есть доступ к вашей закрытой информации, которой вы выбрали поделиться с ними.
      </p>

      <p className="mt-6 max-w-2xl text-sm text-muted-foreground">{EMPTY_TEXT[tab]}</p>
    </div>
  );
}
