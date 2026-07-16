"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { motion } from "framer-motion";
import { Eye, Heart, Send, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useDeleteStory,
  useLikeStory,
  useReplyToStory,
  useViewStory,
} from "@/features/stories/hooks";
import type { StoryGroup } from "@/features/stories/types";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl, resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

import { StoryStatsSheet } from "./StoryStatsSheet";

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
  // Если задан — на своей истории показываем кнопку «В актуальное».
  onAddHighlight?: (storyId: number) => void;
}

export function StoryViewer({
  groups,
  initialGroupIndex,
  onClose,
  onStoryViewed,
  onRemoveStory,
  removeLabel,
  onAddHighlight,
}: StoryViewerProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  // В DTO сторис нет флага «я уже лайкнул» — только счётчик лайков. Поэтому закрашенное
  // сердечко показываем лишь по лайкам, поставленным в текущем сеансе просмотра; сам лайк
  // при этом честно уходит на сервер.
  const [likedInSession, setLikedInSession] = useState<Record<number, boolean>>({});
  // Черновик ответа держим по id истории, чтобы при переходе между сегментами он сбрасывался
  // сам собой (без setState в эффекте) и не смешивался между историями.
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const touchStartX = useRef<number | null>(null);

  const likeStory = useLikeStory();
  const viewStory = useViewStory();
  const deleteStory = useDeleteStory();
  const replyStory = useReplyToStory();
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
    if (!story || paused || statsOpen) return;
    const timer = setTimeout(goNextStory, STORY_DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, paused, statsOpen]);

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

  const handleReply = () => {
    const text = (replyDrafts[story.id] ?? "").trim();
    if (!text) return;
    replyStory.mutate(
      { storyId: story.id, text },
      {
        onSuccess: () => {
          toast.success("Ответ отправлен");
          setReplyDrafts((prev) => ({ ...prev, [story.id]: "" }));
        },
      },
    );
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
                        animationPlayState: paused || statsOpen ? "paused" : "running",
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
          <button type="button" aria-label="Закрыть" onClick={onClose} className="p-1 text-white">
            <X className="size-6" />
          </button>
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

        <footer className="p-3">
          {isOwnGroup ? (
            // Своя история: реальная статистика с бэкенда (только счётчики — списка
            // зрителей API не отдаёт) + действия «В актуальное» и «Удалить».
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStatsOpen(true)}
                aria-label="Кто посмотрел историю"
                className="flex items-center gap-4 text-sm text-white transition-opacity hover:opacity-80"
              >
                <span className="flex items-center gap-1.5">
                  <Eye className="size-5" />
                  {story.viewerDto.viewCount}
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="size-5" />
                  {story.viewerDto.viewLike}
                </span>
              </button>
              <div className="flex items-center gap-3">
                {onAddHighlight && (
                  <button
                    type="button"
                    aria-label="Добавить в актуальное"
                    onClick={() => {
                      onAddHighlight(story.id);
                      toast.success("Добавлено в «Актуальное»");
                    }}
                    className="flex items-center gap-1.5 text-sm font-medium text-white"
                  >
                    <Star className="size-5" />
                    <span className="hidden sm:inline">В актуальное</span>
                  </button>
                )}
                <button
                  type="button"
                  aria-label={
                    onRemoveStory ? (removeLabel ?? "Убрать из «Актуального»") : "Удалить историю"
                  }
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 text-sm font-medium text-white"
                >
                  <Trash2 className="size-5" />
                  <span className="hidden sm:inline">
                    {onRemoveStory ? "Убрать" : "Удалить"}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            // Чужая история: ответ уходит в директ автора + лайк.
            <div className="flex items-center gap-2">
              <input
                value={replyDrafts[story.id] ?? ""}
                onChange={(event) =>
                  setReplyDrafts((prev) => ({ ...prev, [story.id]: event.target.value }))
                }
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleReply();
                  }
                }}
                placeholder={`Ответить ${group.userName}…`}
                aria-label="Ответить на историю"
                className="h-10 flex-1 rounded-full border border-white/40 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/60"
              />
              {(replyDrafts[story.id] ?? "").trim() && (
                <button
                  type="button"
                  aria-label="Отправить ответ"
                  onClick={handleReply}
                  disabled={replyStory.isPending}
                  className="text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Send className="size-6" />
                </button>
              )}
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
            </div>
          )}
        </footer>
      </div>

      {isOwnGroup && (
        <StoryStatsSheet
          open={statsOpen}
          onClose={() => setStatsOpen(false)}
          viewCount={story.viewerDto.viewCount}
          likeCount={story.viewerDto.viewLike}
        />
      )}
    </div>
  );
}
