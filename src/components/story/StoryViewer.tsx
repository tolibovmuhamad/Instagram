"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { motion } from "framer-motion";
import { Heart, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDeleteStory, useLikeStory, useViewStory } from "@/features/stories/hooks";
import type { StoryGroup } from "@/features/stories/types";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl, resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

const STORY_DURATION_MS = 5000;
const SWIPE_THRESHOLD_PX = 60;

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onStoryViewed: (storyId: number) => void;
  // Если задан — кнопка удаления НЕ вызывает DeleteStory, а отдаёт id наружу
  // (для «Актуального»: убираем ссылку, история в архиве остаётся).
  onRemoveStory?: (storyId: number) => void;
  removeLabel?: string;
}

export function StoryViewer({
  groups,
  initialGroupIndex,
  onClose,
  onStoryViewed,
  onRemoveStory,
  removeLabel,
}: StoryViewerProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // В DTO сторис нет флага «я уже лайкнул» — только счётчик лайков. Поэтому закрашенное
  // сердечко показываем лишь по лайкам, поставленным в текущем сеансе просмотра; сам лайк
  // при этом честно уходит на сервер.
  const [likedInSession, setLikedInSession] = useState<Record<number, boolean>>({});
  const touchStartX = useRef<number | null>(null);

  const likeStory = useLikeStory();
  const viewStory = useViewStory();
  const deleteStory = useDeleteStory();
  const { mutate: registerView } = viewStory;

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];
  const isOwnGroup = group?.userId === currentUserId;

  const goNextStory = () => {
    if (!group) return;
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const goPrevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex((i) => i - 1);
      setStoryIndex(prevGroup.stories.length - 1);
    }
  };

  useEffect(() => {
    if (!story) return;
    registerView(story.id);
    onStoryViewed(story.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  useEffect(() => {
    if (!story || paused) return;
    const timer = setTimeout(goNextStory, STORY_DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, paused]);

  if (!group || !story) return null;

  const imageUrl = resolveImageUrl(story.fileName);

  const handleClickZone = (direction: "prev" | "next") => {
    if (direction === "prev") goPrevStory();
    else goNextStory();
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    if (deltaX > 0 && groupIndex > 0) {
      setGroupIndex((i) => i - 1);
      setStoryIndex(0);
    } else if (deltaX < 0 && groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setStoryIndex(0);
    }
  };

  const handleDelete = () => {
    // Режим «Актуального»: убираем ссылку локально, саму историю не трогаем.
    if (onRemoveStory) {
      onRemoveStory(story.id);
      toast.success("Убрано из «Актуального»");
      onClose();
      return;
    }
    deleteStory.mutate(story.id, {
      onSuccess: () => {
        toast.success("Сторис удалена");
        onClose();
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative flex h-full w-full max-w-md flex-col">
        <div className="flex gap-1 p-2">
          {group.stories.map((segment, index) => (
            <div key={segment.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className={cn(
                  "h-full bg-white",
                  index < storyIndex && "w-full",
                  index > storyIndex && "w-0",
                )}
                style={
                  index === storyIndex
                    ? {
                        animation: `story-progress ${STORY_DURATION_MS}ms linear forwards`,
                        animationPlayState: paused ? "paused" : "running",
                      }
                    : undefined
                }
              />
            </div>
          ))}
        </div>

        <header className="flex items-center justify-between px-3 pb-2">
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarImage src={resolveAvatarUrl(group.userImage)} alt={group.userName} />
              <AvatarFallback>{group.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-white">{group.userName}</span>
            <span className="text-xs text-white/70">
              {formatDistanceToNow(new Date(story.createAt), { addSuffix: true, locale: ru })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {(isOwnGroup || onRemoveStory) && (
              <button
                type="button"
                aria-label={onRemoveStory ? (removeLabel ?? "Убрать из «Актуального»") : "Удалить сторис"}
                onClick={handleDelete}
                className="p-1 text-white"
              >
                <Trash2 className="size-5" />
              </button>
            )}
            <button type="button" aria-label="Закрыть" onClick={onClose} className="p-1 text-white">
              <X className="size-6" />
            </button>
          </div>
        </header>

        <div className="relative flex-1 bg-black">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="500px"
              className="object-contain"
              onMouseDown={() => setPaused(true)}
              onMouseUp={() => setPaused(false)}
            />
          )}

          <button
            type="button"
            aria-label="Предыдущая сторис"
            onClick={() => handleClickZone("prev")}
            className="absolute inset-y-0 left-0 w-1/3"
          />
          <button
            type="button"
            aria-label="Следующая сторис"
            onClick={() => handleClickZone("next")}
            className="absolute inset-y-0 right-0 w-2/3"
          />
        </div>

        <footer className="flex items-center justify-end p-3">
          <motion.button
            type="button"
            aria-label={likedInSession[story.id] ? "Убрать лайк" : "Поставить лайк"}
            whileTap={{ scale: 1.3 }}
            onClick={() => {
              likeStory.mutate(story.id);
              setLikedInSession((prev) => ({ ...prev, [story.id]: !prev[story.id] }));
            }}
          >
            <Heart
              className={cn(
                "size-6 text-white",
                likedInSession[story.id] && "fill-red-500 text-red-500",
              )}
            />
          </motion.button>
        </footer>
      </div>
    </div>
  );
}
