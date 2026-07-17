"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { STORY_RING_CLASS } from "@/components/story/storyRing";
import { useDeleteAvatar } from "@/features/users/hooks";
import type { StoryRing } from "@/features/stories/types";
import { resolveAvatarUrl } from "@/lib/utils/image";

import { cn } from "@/lib/utils";

import { AvatarUploadDialog } from "./AvatarUploadDialog";

interface AvatarEditorProps {
  image: string | null;
  fallback: string;
  /** Размер аватара (Tailwind size-*). По умолчанию size-24. */
  className?: string;
  /**
   * Кольцо истории вокруг аватара: "unviewed" — градиент, "viewed" — серое (история уже
   * просмотрена), "none"/undefined — кольца нет (активных историй нет).
   */
  storyRing?: StoryRing;
  /** Если задан — клик по аватару открывает историю (а не меняет фото). */
  onAvatarClick?: () => void;
}

export function AvatarEditor({
  image,
  fallback,
  className,
  storyRing = "none",
  onAvatarClick,
}: AvatarEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickedImageSrc, setPickedImageSrc] = useState<string | null>(null);
  const deleteAvatar = useDeleteAvatar();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPickedImageSrc(URL.createObjectURL(file));
    event.target.value = "";
  };

  const handleDialogChange = (open: boolean) => {
    if (!open && pickedImageSrc) {
      URL.revokeObjectURL(pickedImageSrc);
      setPickedImageSrc(null);
    }
  };

  const hasRing = storyRing !== "none";

  const avatar = (
    <Avatar className={cn("size-24", className, hasRing && "border-2 border-background")}>
      <AvatarImage src={resolveAvatarUrl(image)} alt={fallback} />
      <AvatarFallback className="text-2xl">{fallback.slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
  );

  return (
    <div className="group/avatar relative w-fit">
      {/* Кольцо истории (как в оригинале): градиент/зелёное — непросмотренные, серое — всё
          просмотрено, без кольца — активных историй нет. */}
      <div className={cn("rounded-full", hasRing && `${STORY_RING_CLASS[storyRing]} p-[3px]`)}>
        {onAvatarClick ? (
          <button
            type="button"
            onClick={onAvatarClick}
            aria-label="Открыть вашу историю"
            className="block rounded-full"
          >
            {avatar}
          </button>
        ) : (
          avatar
        )}
      </div>

      <div className="absolute -right-1 -bottom-1 flex gap-1">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="size-8 rounded-full border-2 border-background shadow-sm"
          onClick={() => inputRef.current?.click()}
          aria-label="Изменить фото профиля"
        >
          <Camera className="size-3.5" />
        </Button>
        {image && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-8 rounded-full border-2 border-background shadow-sm opacity-0 transition-opacity group-hover/avatar:opacity-100"
            onClick={() => deleteAvatar.mutate()}
            disabled={deleteAvatar.isPending}
            aria-label="Удалить фото профиля"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {pickedImageSrc && (
        <AvatarUploadDialog open imageSrc={pickedImageSrc} onOpenChange={handleDialogChange} />
      )}
    </div>
  );
}
