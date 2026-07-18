"use client";

import { Lock, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STORY_RING_CLASS } from "@/components/story/storyRing";
import { AccountSwitcherDialog } from "@/components/nav/AccountSwitcherDialog";
import { useAccounts } from "@/features/auth/useAccounts";
import { useMyStories, useUserStories } from "@/features/stories/hooks";
import {
  getActiveStories,
  getStoryRing,
  type StoryGroup,
  type StoryRing,
} from "@/features/stories/types";
import type { UserProfile } from "@/features/users/types";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl, resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";
import { useHighlightsStore } from "@/store/highlights";
import { useStoryViewsStore } from "@/store/storyViews";

import { HighlightPickerDialog } from "@/components/story/HighlightPickerDialog";
import { StoryViewer } from "@/components/story/StoryViewer";
import { AvatarEditor } from "./AvatarEditor";
import { CloseFriendButton } from "./CloseFriendButton";
import { EditProfileDialog } from "./EditProfileDialog";
import { FollowButton } from "./FollowButton";
import { FollowListDialog } from "./FollowListDialog";
import { ProfileOptionsMenu } from "./ProfileOptionsMenu";

interface ProfileHeaderProps {
  userId: string;
  profile: UserProfile;
  isOwnProfile: boolean;
}

const numberFormat = new Intl.NumberFormat("ru-RU");

// Стабильная ссылка на «нет highlights» — чтобы селектор стора не давал новый массив
// на каждый рендер и не гонял лишние ререндеры.
const EMPTY_IDS: number[] = [];

// Серая «пилюля»-кнопка Instagram (#efefef): «Редактировать профиль» и т.п.
const grayButtonClass =
  "flex h-10 flex-1 items-center justify-center rounded-lg bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]";

// Пункты меню шестерёнки, повторяют выпадашку Instagram. Часть — заглушки (нет
// соответствующего бэкенда): при клике показываем тост.
const settingsPlaceholderItems = ["QR-код", "Уведомления"];
const settingsPlaceholderItems2 = ["Meta Verified", "Родительский контроль", "Входы в аккаунт"];
const settingsMenuItemClass = "cursor-pointer rounded-none px-4 py-3.5 text-[15px]";

// Аватар чужого профиля: то же кольцо истории, что и в ленте, но без кнопок редактирования
// (их даёт AvatarEditor на своём профиле). Клик открывает истории — если они есть.
function StoryRingAvatar({
  image,
  userName,
  storyRing,
  onClick,
}: {
  image: string | null;
  userName: string;
  storyRing: StoryRing;
  onClick?: () => void;
}) {
  const hasRing = storyRing !== "none";
  const avatar = (
    <Avatar className={cn("size-20 md:size-[150px]", hasRing && "border-2 border-background")}>
      <AvatarImage src={resolveAvatarUrl(image)} alt={userName} />
      <AvatarFallback className="text-4xl">{userName.slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
  );

  return (
    <div className={cn("w-fit rounded-full", hasRing && `${STORY_RING_CLASS[storyRing]} p-[3px]`)}>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={`Открыть истории: ${userName}`}
          className="block rounded-full"
        >
          {avatar}
        </button>
      ) : (
        avatar
      )}
    </div>
  );
}

export function ProfileHeader({ userId, profile, isOwnProfile }: ProfileHeaderProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [followListMode, setFollowListMode] = useState<"subscribers" | "subscriptions" | null>(
    null,
  );
  const [isHighlightViewerOpen, setIsHighlightViewerOpen] = useState(false);
  const [isArchiveViewerOpen, setIsArchiveViewerOpen] = useState(false);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const { accounts, activeUserId, logoutOne } = useAccounts();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const displayName = profile.fullName;

  // Архив = все мои истории (get-my-stories); в бэкенде они не исчезают. Highlights держим
  // локально как ссылки на id из архива (см. useHighlightsStore) — только для своего профиля,
  // т.к. чужие highlights серверу неизвестны.
  const myStoriesQuery = useMyStories();
  const archive = useMemo(
    () => [...(myStoriesQuery.data ?? [])].sort((a, b) => a.createAt.localeCompare(b.createAt)),
    [myStoriesQuery.data],
  );

  // Чужие истории тянем отдельным запросом: get-my-stories — только свои, а кольцо нужно и
  // на чужом аватаре. Свой профиль не дёргает лишний раз — там уже есть архив.
  // Закрытый аккаунт без подписки не трогаем вовсе (та же проверка, что прячет контент в
  // ProfileView): историй нам всё равно не покажут, а ошибка запроса вылезла бы тостом.
  const isLocked = !isOwnProfile && profile.isPrivate && !profile.isFollowing;
  const userStoriesQuery = useUserStories(isOwnProfile || isLocked ? "" : userId);
  const otherStories = useMemo(
    () => [...(userStoriesQuery.data ?? [])].sort((a, b) => a.createAt.localeCompare(b.createAt)),
    [userStoriesQuery.data],
  );

  // Кольцо горит только за «живые» истории (24 часа), а не за весь архив — иначе оно
  // светилось бы вечно, ведь бэкенд истории не удаляет. Архив ниже остаётся полным.
  const activeStories = useMemo(
    () => getActiveStories(isOwnProfile ? archive : otherStories),
    [isOwnProfile, archive, otherStories],
  );

  const markViewedStory = useStoryViewsStore((state) => state.markViewed);
  const viewedStoryIds = useStoryViewsStore((state) => state.byUser[currentUserId ?? ""]);
  const storyRing = getStoryRing(activeStories, (id) => !!viewedStoryIds?.includes(id));

  const markViewed = (storyId: number) => {
    if (currentUserId) markViewedStory(currentUserId, storyId);
  };
  const highlightIds = useHighlightsStore((state) => state.byUser[userId]) ?? EMPTY_IDS;
  const addHighlights = useHighlightsStore((state) => state.addHighlights);
  const removeHighlight = useHighlightsStore((state) => state.removeHighlight);

  // Только валидные ссылки: если история удалена из архива, из «Актуального» она тоже пропадает.
  const highlightStories = useMemo(
    () => archive.filter((story) => highlightIds.includes(story.id)),
    [archive, highlightIds],
  );

  const buildGroup = (stories: typeof archive): StoryGroup | undefined =>
    stories.length === 0
      ? undefined
      : {
          userId,
          userName: profile.userName,
          userImage: profile.image,
          isVerified: profile.isVerified,
          stories,
        };

  const highlightGroup = buildGroup(highlightStories);
  const archiveGroup = buildGroup(archive);
  const activeGroup = buildGroup(activeStories);
  const highlightCover = highlightStories.length
    ? resolveImageUrl(highlightStories[highlightStories.length - 1].fileName)
    : undefined;

  const handleOpenArchive = () => {
    if (archiveGroup) setIsArchiveViewerOpen(true);
    else toast("В архиве пока нет историй");
  };

  // Клик по аватару открывает ЖИВЫЕ истории (как в оригинале). Архив остаётся на своей
  // кнопке «Посмотреть архив» — иначе аватар открывал бы истории годичной давности.
  const handleOpenStories = activeGroup ? () => setIsStoryViewerOpen(true) : undefined;

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
                storyRing={storyRing}
                onAvatarClick={handleOpenStories}
              />
            ) : (
              <StoryRingAvatar
                image={profile.image}
                userName={profile.userName}
                storyRing={storyRing}
                onClick={handleOpenStories}
              />
            )}
          </div>

          <div className="flex-1 space-y-3 pt-1 md:pt-3">
            <div className="flex items-center gap-3">
              <h1 className="flex items-center gap-1.5 text-xl font-semibold tracking-tight">
                {profile.userName}
                {profile.isPrivate && (
                  <Lock
                    className="size-4 text-muted-foreground"
                    aria-label="Закрытый аккаунт"
                  />
                )}
              </h1>
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
                    <DropdownMenuItem
                      className={settingsMenuItemClass}
                      onClick={() => setIsSwitcherOpen(true)}
                    >
                      Сменить аккаунт
                      {accounts.length > 1 && (
                        <span className="ml-auto text-[13px] text-muted-foreground">
                          {accounts.length}
                        </span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={settingsMenuItemClass}
                      onClick={() => {
                        if (activeUserId) void logoutOne(activeUserId);
                      }}
                    >
                      Выйти
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {!isOwnProfile && (
                <ProfileOptionsMenu userId={userId} userName={profile.userName} />
              )}
            </div>

            {(displayName || profile.about) && (
              <div className="space-y-0.5 text-sm">
                {displayName && <p className="font-semibold">{displayName}</p>}
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
                  {numberFormat.format(profile.followersCount)}
                </strong>{" "}
                подписчиков
              </button>
              <button type="button" onClick={() => setFollowListMode("subscriptions")}>
                <strong className="font-semibold">
                  {numberFormat.format(profile.followingCount)}
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
              <button type="button" className={grayButtonClass} onClick={handleOpenArchive}>
                Посмотреть архив
              </button>
            </>
          ) : (
            <>
              <div className="flex-1">
                <FollowButton
                  targetUserId={userId}
                  isFollowing={profile.isFollowing}
                  isRequested={profile.isRequested}
                  isPrivate={profile.isPrivate}
                />
              </div>
              <CloseFriendButton userId={userId} />
            </>
          )}
        </div>

        {/* Актуальное (highlights): ссылки на истории из архива. Управляем только своим —
            чужие highlights серверу неизвестны (модуля highlights в API нет). */}
        {isOwnProfile && (
          <div className="mt-8 flex gap-5">
            {highlightGroup && (
              <button
                type="button"
                onClick={() => setIsHighlightViewerOpen(true)}
                className="flex flex-col items-center gap-1.5"
              >
                <span className="grid size-[72px] place-items-center overflow-hidden rounded-full border border-border md:size-[84px]">
                  <Avatar className="size-[64px] md:size-[76px]">
                    <AvatarImage src={highlightCover} alt="Актуальное" className="object-cover" />
                    <AvatarFallback>{profile.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </span>
                <span className="text-xs font-medium">Актуальное</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
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

      {/* Вьюер живых историй (клик по аватару). Отмечает просмотр — кольцо гаснет и здесь,
          и в ленте: и там, и там отметки берутся из useStoryViewsStore. */}
      {isStoryViewerOpen && activeGroup && (
        <StoryViewer
          groups={[activeGroup]}
          initialGroupIndex={0}
          onClose={() => setIsStoryViewerOpen(false)}
          onStoryViewed={markViewed}
          onAddHighlight={isOwnProfile ? (storyId) => addHighlights(userId, [storyId]) : undefined}
        />
      )}

      {/* Вьюер «Актуального»: удаление УБИРАЕТ ссылку (история в архиве остаётся). */}
      {isHighlightViewerOpen && highlightGroup && (
        <StoryViewer
          groups={[highlightGroup]}
          initialGroupIndex={0}
          onClose={() => setIsHighlightViewerOpen(false)}
          onStoryViewed={() => {}}
          onRemoveStory={(storyId) => removeHighlight(userId, storyId)}
          removeLabel="Убрать из «Актуального»"
        />
      )}

      {/* Вьюер архива: удаление настоящее (DeleteStory) + можно добавить в «Актуальное». */}
      {isArchiveViewerOpen && archiveGroup && (
        <StoryViewer
          groups={[archiveGroup]}
          initialGroupIndex={0}
          onClose={() => setIsArchiveViewerOpen(false)}
          onStoryViewed={() => {}}
          onAddHighlight={(storyId) => addHighlights(userId, [storyId])}
        />
      )}

      {isOwnProfile && (
        <HighlightPickerDialog
          open={isPickerOpen}
          onOpenChange={setIsPickerOpen}
          existingIds={highlightIds}
          onConfirm={(storyIds) => addHighlights(userId, storyIds)}
        />
      )}

      {isOwnProfile && (
        <EditProfileDialog open={isEditOpen} onOpenChange={setIsEditOpen} profile={profile} />
      )}

      {isOwnProfile && (
        <AccountSwitcherDialog open={isSwitcherOpen} onOpenChange={setIsSwitcherOpen} />
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
