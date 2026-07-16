"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useDeleteAvatar } from "@/features/users/hooks";
import { resolveAvatarUrl } from "@/lib/utils/image";

import { cn } from "@/lib/utils";

import { AvatarUploadDialog } from "./AvatarUploadDialog";

interface AvatarEditorProps {
  image: string | null;
  fallback: string;
  /** Размер аватара (Tailwind size-*). По умолчанию size-24. */
  className?: string;
  /** Показать градиентное кольцо истории вокруг аватара. */
  hasStoryRing?: boolean;
  /** Если задан — клик по аватару открывает историю (а не меняет фото). */
  onAvatarClick?: () => void;
}

export function AvatarEditor({
  image,
  fallback,
  className,
  hasStoryRing,
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

  const avatar = (
    <Avatar className={cn("size-24", className, hasStoryRing && "border-2 border-background")}>
      <AvatarImage src={resolveAvatarUrl(image)} alt={fallback} />
      <AvatarFallback className="text-2xl">{fallback.slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
  );

  return (
    <div className="group/avatar relative w-fit">
      {/* Кольцо истории (как в оригинале): градиент вокруг аватара. */}
      <div
        className={cn(
          "rounded-full",
          hasStoryRing &&
            "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]",
        )}
      >
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
