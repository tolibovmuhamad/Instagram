"use client";

import { useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { LiveAvatarRail } from "@/components/live/LiveAvatarRail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyStories, useStories } from "@/features/stories/hooks";
import { getActiveStories, getStoryRing, groupStoriesByUser } from "@/features/stories/types";
import { useMyProfile } from "@/features/users/hooks";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";
import { useHighlightsStore } from "@/store/highlights";
import { useStoryViewsStore } from "@/store/storyViews";

import { CreateStoryDialog } from "./CreateStoryDialog";
import { STORY_RING_CLASS } from "./storyRing";
import { StoryViewer } from "./StoryViewer";

export function StoryAvatarRail() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const currentUserName = useAuthStore((state) => state.user?.userName);
  const storiesQuery = useStories();
  const myStoriesQuery = useMyStories();
  const myProfileQuery = useMyProfile();
  const addHighlights = useHighlightsStore((state) => state.addHighlights);
  // Отметки просмотра переживают перезагрузку (localStorage) — иначе кольцо гасло только
  // до обновления страницы и снова становилось градиентным.
  const markViewedStory = useStoryViewsStore((state) => state.markViewed);
  const viewedStoryIds = useStoryViewsStore((state) => state.byUser[currentUserId ?? ""]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewerGroupIndex, setViewerGroupIndex] = useState<number | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // get-stories отдаёт только сторис подписок, БЕЗ собственных — свои берём отдельно из
  // get-my-stories, иначе после публикации кружок «Ваша история» остаётся пустым.
  // get-my-stories — это ВЕСЬ архив (бэкенд истории не удаляет), поэтому оставляем только
  // живые: иначе кружок горел бы вечно, даже когда показывать уже нечего.
  const ownGroup = useMemo(() => {
    const mine = getActiveStories(myStoriesQuery.data ?? []);
    if (mine.length === 0) return undefined;
    const [group] = groupStoriesByUser(mine);
    return group;
  }, [myStoriesQuery.data]);

  // На всякий случай отфильтровываем себя из ленты подписок (обычно её там и нет),
  // затем ставим свой кружок первым — как в оригинале.
  const followedGroups = (storiesQuery.data ?? []).filter(
    (group) => group.userId !== currentUserId,
  );
  const groups = ownGroup ? [ownGroup, ...followedGroups] : followedGroups;

  // Свой аватар в рельсе берём из профиля — в JWT/auth-сторе его нет, а сторис-DTO
  // отдаёт userAvatar только когда у автора уже есть сторис. Так кружок «Ваша история»
  // показывает ту же картинку, что сайдбар и профиль, а не букву-заглушку.
  const myAvatar = resolveAvatarUrl(myProfileQuery.data?.image ?? ownGroup?.userImage);
  const myInitial = (
    myProfileQuery.data?.fullName ??
    myProfileQuery.data?.userName ??
    currentUserName ??
    "Я"
  )
    .slice(0, 1)
    .toUpperCase();

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPickedFile(file);
      setIsCreateOpen(true);
    }
    event.target.value = "";
  };

  const markViewed = (storyId: number) => {
    if (currentUserId) markViewedStory(currentUserId, storyId);
  };

  // Кольцо считает общий с профилем getStoryRing: горит, пока осталась непросмотренная
  // история, иначе серое. В группах рельса уже только живые истории (см. ownGroup/groups).
  const ringClass = (group: (typeof groups)[number]) =>
    STORY_RING_CLASS[getStoryRing(group.stories, (id) => !!viewedStoryIds?.includes(id))];

  if (storiesQuery.isPending) {
    return (
      <div className="flex gap-4 overflow-x-auto py-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="size-20 shrink-0 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex shrink-0 flex-col items-center gap-1">
        <div
          className={cn(
            "relative flex size-20 items-center justify-center rounded-full p-0.5",
            ownGroup && ownGroup.stories.length > 0 ? ringClass(ownGroup) : "bg-muted",
          )}
        >
          {ownGroup && ownGroup.stories.length > 0 ? (
            <button
              type="button"
              aria-label="Открыть вашу сторис"
              onClick={() => setViewerGroupIndex(groups.indexOf(ownGroup))}
              className="size-full"
            >
              <Avatar className="size-full border-2 border-background">
                <AvatarImage src={myAvatar} alt="Ваша сторис" />
                <AvatarFallback>{myInitial}</AvatarFallback>
              </Avatar>
            </button>
          ) : (
            <Avatar className="size-full border-2 border-background">
              <AvatarImage src={myAvatar} alt="Ваш аватар" />
              <AvatarFallback>{myInitial}</AvatarFallback>
            </Avatar>
          )}
          <button
            type="button"
            aria-label="Добавить сторис"
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-0 bottom-0 flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <span className="max-w-20 truncate text-xs text-muted-foreground">Ваша история</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {/* Эфиры идут сразу за своим кружком, перед сторис — как в оригинале. */}
      <LiveAvatarRail />

      {groups
        .filter((group) => group.userId !== currentUserId && group.stories.length > 0)
        .map((group) => {
          const groupIndex = groups.indexOf(group);
          return (
            <div key={group.userId} className="flex shrink-0 flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => setViewerGroupIndex(groupIndex)}
                className={cn(
                  "flex size-20 items-center justify-center rounded-full p-0.5",
                  ringClass(group),
                )}
              >
                <Avatar className="size-full border-2 border-background">
                  <AvatarImage src={resolveAvatarUrl(group.userImage)} alt={group.userName} />
                  <AvatarFallback>{group.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
              </button>
              <span className="max-w-20 truncate text-xs">{group.userName}</span>
            </div>
          );
        })}

      {viewerGroupIndex !== null && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={viewerGroupIndex}
          onClose={() => setViewerGroupIndex(null)}
          onStoryViewed={markViewed}
          onAddHighlight={
            currentUserId ? (storyId) => addHighlights(currentUserId, [storyId]) : undefined
          }
        />
      )}

      <CreateStoryDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} file={pickedFile} />
    </div>
  );
}
