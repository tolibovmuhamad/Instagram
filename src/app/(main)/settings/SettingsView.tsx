"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

import { AppsAndSitesPanel } from "./AppsAndSitesPanel";
import { ChangePasswordPanel } from "./ChangePasswordPanel";
import { getSettingsTitle, SETTINGS_SECTIONS } from "./settings-nav";

const FOOTER_LINKS = [
  "Meta",
  "Информация",
  "Блог",
  "Вакансии",
  "Помощь",
  "API",
  "Конфиденциальность",
  "Условия",
  "Места",
  "Популярное",
  "Instagram Lite",
  "Meta AI",
  "Threads",
];

function MetaLogo() {
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
      <span className="text-base leading-none text-[#0081FB]">∞</span>
      Meta
    </span>
  );
}

function RightPanel({ active }: { active: string }) {
  if (active === "apps") return <AppsAndSitesPanel />;
  if (active === "accounts-center") return <ChangePasswordPanel />;
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
      <p className="text-sm text-muted-foreground">Этот раздел находится в разработке.</p>
    </div>
  );
}

export function SettingsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const userId = useAuthStore((state) => state.user?.id);

  const active = sectionParam ?? "accounts-center";
  const [search, setSearch] = useState("");

  const sections = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return SETTINGS_SECTIONS;
    return SETTINGS_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => item.label.toLowerCase().includes(term)),
    })).filter((section) => section.items.length > 0);
  }, [search]);

  const handleSelect = (id: string) => {
    if (id === "edit-profile") {
      router.push(userId ? `/profile/${userId}` : "/profile");
      return;
    }
    router.replace(`/settings?section=${id}`, { scroll: false });
  };

  return (
    <div className="flex h-[calc(100dvh-4rem)] w-full md:h-dvh">
      {/* Левое меню. */}
      <aside className="w-full shrink-0 overflow-y-auto border-r px-4 py-6 md:w-[360px] xl:w-[400px]">
        <h1 className="px-3 text-[26px] font-bold tracking-tight">Настройки</h1>

        <div className="relative mt-4 px-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поисковый запрос"
            aria-label="Поиск в настройках"
            className="h-11 w-full rounded-full bg-muted pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <nav className="mt-4 space-y-1">
          {sections.map((section, index) => (
            <div key={section.title ?? index} className="pb-2">
              {section.title && (
                <div className="flex items-center justify-between px-3 pb-1 pt-4">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {section.title}
                  </span>
                  {section.metaLogo && <MetaLogo />}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={cn(
                      "flex w-full items-start gap-4 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted",
                      isActive && "bg-muted",
                    )}
                  >
                    <Icon className="mt-0.5 size-6 shrink-0" strokeWidth={1.75} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium leading-snug">{item.label}</span>
                      {item.subtitle && (
                        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                          {item.subtitle}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}

          {sections.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">Ничего не найдено</p>
          )}
        </nav>
      </aside>

      {/* Правая область + футер. */}
      <main className="hidden flex-1 flex-col overflow-y-auto md:flex">
        <div className="flex-1 px-8 py-8 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-3">
              <button
                type="button"
                aria-label="Назад"
                onClick={() => router.back()}
                className="text-foreground/80 hover:text-foreground"
              >
                <ChevronLeft className="size-6" />
              </button>
              <h2 className="text-2xl font-bold tracking-tight">{getSettingsTitle(active)}</h2>
            </div>

            <RightPanel active={active} />
          </div>
        </div>

        <footer className="px-8 py-8 lg:px-16">
          <div className="mx-auto max-w-3xl space-y-3 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {FOOTER_LINKS.map((link) => (
                <span key={link} className="cursor-pointer hover:underline">
                  {link}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="cursor-pointer hover:underline">
                Загрузка контактов и лица, не являющиеся пользователями
              </span>
              <span className="cursor-pointer hover:underline">Meta Verified</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <span className="cursor-pointer hover:underline">Русский ⌄</span>
              <span>© 2026 Instagram from Meta</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
