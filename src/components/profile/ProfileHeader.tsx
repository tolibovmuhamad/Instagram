"use client";

import { Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserProfile } from "@/features/users/types";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

import { AvatarEditor } from "./AvatarEditor";
import { EditProfileDialog } from "./EditProfileDialog";
import { FollowButton } from "./FollowButton";
import { FollowListDialog } from "./FollowListDialog";

interface ProfileHeaderProps {
  userId: string;
  profile: UserProfile;
  isOwnProfile: boolean;
  isSubscriber?: boolean;
}

const numberFormat = new Intl.NumberFormat("ru-RU");

// Серая «пилюля»-кнопка Instagram (#efefef): «Редактировать профиль» и т.п.
const grayButtonClass =
  "flex h-10 flex-1 items-center justify-center rounded-lg bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]";

// Пункты меню шестерёнки, повторяют выпадашку Instagram. Часть — заглушки (нет
// соответствующего бэкенда): при клике показываем тост.
const settingsPlaceholderItems = ["QR-код", "Уведомления"];
const settingsPlaceholderItems2 = ["Meta Verified", "Родительский контроль", "Входы в аккаунт"];
const settingsMenuItemClass = "cursor-pointer rounded-none px-4 py-3.5 text-[15px]";

export function ProfileHeader({ userId, profile, isOwnProfile, isSubscriber }: ProfileHeaderProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [followListMode, setFollowListMode] = useState<"subscribers" | "subscriptions" | null>(
    null,
  );
  const logout = useAuthStore((state) => state.logout);
  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");

  return (
    <header className="border-b px-4 pb-6 pt-4 md:pb-8 md:pt-8">
      <div>
        {/* Верх: аватар слева, информация справа. */}
        <div className="flex items-start gap-8 md:gap-10">
          <div className="relative shrink-0">
            {isOwnProfile && (
              <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 select-none">
                <div className="relative rounded-2xl bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
                  Заметка…
                  <span className="absolute -bottom-1 left-1/2 size-2.5 -translate-x-1/2 rotate-45 rounded-[3px] bg-muted" />
                </div>
              </div>
            )}
            {isOwnProfile ? (
              <AvatarEditor
                image={profile.image}
                fallback={profile.userName}
                className="size-20 md:size-[150px]"
              />
            ) : (
              <Avatar className="size-20 md:size-[150px]">
                <AvatarImage src={resolveImageUrl(profile.image)} alt={profile.userName} />
                <AvatarFallback className="text-4xl">
                  {profile.userName.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          <div className="flex-1 space-y-3 pt-1 md:pt-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">{profile.userName}</h1>
              {isOwnProfile && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        aria-label="Настройки"
                        className="text-foreground/90 transition-colors hover:text-foreground"
                      />
                    }
                  >
                    <Settings className="size-6" strokeWidth={1.75} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={8}
                    className="w-[300px] overflow-hidden rounded-2xl p-0 shadow-xl"
                  >
                    <DropdownMenuItem
                      render={<Link href="/settings?section=apps" />}
                      className={settingsMenuItemClass}
                    >
                      Приложения и сайты
                    </DropdownMenuItem>
                    {settingsPlaceholderItems.map((label) => (
                      <DropdownMenuItem
                        key={label}
                        className={settingsMenuItemClass}
                        onClick={() => toast(`«${label}» пока недоступно`)}
                      >
                        {label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      render={<Link href="/settings" />}
                      className={settingsMenuItemClass}
                    >
                      Настройки и конфиденциальность
                    </DropdownMenuItem>
                    {settingsPlaceholderItems2.map((label) => (
                      <DropdownMenuItem
                        key={label}
                        className={settingsMenuItemClass}
                        onClick={() => toast(`«${label}» пока недоступно`)}
                      >
                        {label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="my-0" />
                    <DropdownMenuItem className={settingsMenuItemClass} onClick={logout}>
                      Выйти
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {(displayName || profile.about || profile.occupation) && (
              <div className="space-y-0.5 text-sm">
                {displayName && <p className="font-semibold">{displayName}</p>}
                {profile.occupation && <p className="text-muted-foreground">{profile.occupation}</p>}
                {profile.about && <p className="whitespace-pre-line">{profile.about}</p>}
              </div>
            )}

            <div className="flex gap-7 text-[15px]">
              <span>
                <strong className="font-semibold">{numberFormat.format(profile.postCount)}</strong>{" "}
                публикаций
              </span>
              <button type="button" onClick={() => setFollowListMode("subscribers")}>
                <strong className="font-semibold">
                  {numberFormat.format(profile.subscribersCount)}
                </strong>{" "}
                подписчиков
              </button>
              <button type="button" onClick={() => setFollowListMode("subscriptions")}>
                <strong className="font-semibold">
                  {numberFormat.format(profile.subscriptionsCount)}
                </strong>{" "}
                подписок
              </button>
            </div>
          </div>
        </div>

        {/* Кнопки действий — широкой строкой под шапкой, как в i2. */}
        <div className="mt-5 flex gap-2">
          {isOwnProfile ? (
            <>
              <button type="button" className={grayButtonClass} onClick={() => setIsEditOpen(true)}>
                Редактировать профиль
              </button>
              <button
                type="button"
                className={grayButtonClass}
                onClick={() => toast("Раздел «Архив» пока недоступен")}
              >
                Посмотреть архив
              </button>
            </>
          ) : (
            isSubscriber !== undefined && (
              <div className="flex-1">
                <FollowButton targetUserId={userId} isSubscriber={isSubscriber} />
              </div>
            )
          )}
        </div>

        {/* Актуальное (highlights): для своего профиля показываем кружок «Добавить». */}
        {isOwnProfile && (
          <div className="mt-8 flex gap-5">
            <button
              type="button"
              onClick={() => toast("«Актуальное» пока недоступно")}
              className="flex flex-col items-center gap-1.5"
            >
              <span className="grid size-[72px] place-items-center rounded-full border border-border text-muted-foreground md:size-[84px]">
                <Plus className="size-7" strokeWidth={1.5} />
              </span>
              <span className="text-xs font-medium">Добавить</span>
            </button>
          </div>
        )}
      </div>

      {isOwnProfile && (
        <EditProfileDialog open={isEditOpen} onOpenChange={setIsEditOpen} profile={profile} />
      )}

      {followListMode && (
        <FollowListDialog
          userId={userId}
          mode={followListMode}
          open={!!followListMode}
          onOpenChange={(open) => setFollowListMode(open ? followListMode : null)}
        />
      )}
    </header>
  );
}
