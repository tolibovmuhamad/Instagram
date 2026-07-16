"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Archive } from "lucide-react";

import { StoryViewer } from "@/components/story/StoryViewer";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyStories } from "@/features/stories/hooks";
import type { Story, StoryGroup } from "@/features/stories/types";
import { useMyProfile } from "@/features/users/hooks";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";
import { useHighlightsStore } from "@/store/highlights";

import { EmptyState, PanelIntro } from "./_shared";

// Архив историй: get-my-stories на этом бэкенде не удаляет истории по истечении 24 часов —
// они хранятся, пока автор их не удалит. Поэтому здесь показываем их как постоянный архив,
// как в оригинальном Instagram. Клик открывает историю (с удалением и «В актуальное»).
export function ArchivePanel() {
  const { data, isPending, isError } = useMyStories();
  const profile = useMyProfile().data;
  const userId = useAuthStore((state) => state.user?.id);
  const addHighlights = useHighlightsStore((state) => state.addHighlights);
  const [openStory, setOpenStory] = useState<Story | null>(null);

  const stories = useMemo(
    () => [...(data ?? [])].sort((a, b) => b.createAt.localeCompare(a.createAt)),
    [data],
  );

  const group: StoryGroup | null =
    openStory && userId
      ? {
          userId,
          userName: profile?.userName ?? "",
          userImage: profile?.image ?? null,
          isVerified: profile?.isVerified ?? false,
          stories: [openStory],
        }
      : null;

  return (
    <div className="max-w-2xl">
      <PanelIntro>
        Здесь хранятся все ваши истории. Их видите только вы. Истории не исчезают через 24
        часа — они остаются в архиве, пока вы не удалите их сами.
      </PanelIntro>

      {isPending && (
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[9/16] w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && <p className="py-10 text-sm text-destructive">Не удалось загрузить архив</p>}

      {!isPending && !isError && stories.length === 0 && (
        <EmptyState icon={Archive} text="В архиве пока нет историй. Опубликуйте историю — и она сохранится здесь." />
      )}

      <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
        {stories.map((story) => {
          const url = resolveImageUrl(story.fileName);
          return (
            <button
              key={story.id}
              type="button"
              onClick={() => setOpenStory(story)}
              className="relative aspect-[9/16] overflow-hidden rounded-lg bg-muted"
            >
              {url && <Image src={url} alt="" fill sizes="160px" className="object-cover" />}
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[11px] font-medium text-white">
                {format(new Date(story.createAt), "d MMM", { locale: ru })}
              </span>
            </button>
          );
        })}
      </div>

      {group && (
        <StoryViewer
          groups={[group]}
          initialGroupIndex={0}
          onClose={() => setOpenStory(null)}
          onStoryViewed={() => {}}
          onAddHighlight={
            userId ? (storyId) => addHighlights(userId, [storyId]) : undefined
          }
        />
      )}
    </div>
  );
}
