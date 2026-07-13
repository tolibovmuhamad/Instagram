"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useDeleteAvatar } from "@/features/users/hooks";
import { resolveImageUrl } from "@/lib/utils/image";

import { AvatarUploadDialog } from "./AvatarUploadDialog";

interface AvatarEditorProps {
  image: string | null;
  fallback: string;
}

export function AvatarEditor({ image, fallback }: AvatarEditorProps) {
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

  return (
    <div className="relative">
      <Avatar className="size-24">
        <AvatarImage src={resolveImageUrl(image)} alt={fallback} />
        <AvatarFallback className="text-2xl">{fallback.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="absolute -right-1 -bottom-1 flex gap-1">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="size-7 rounded-full"
          onClick={() => inputRef.current?.click()}
          aria-label="Загрузить новый аватар"
        >
          <Camera className="size-3.5" />
        </Button>
        {image && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-7 rounded-full"
            onClick={() => deleteAvatar.mutate()}
            disabled={deleteAvatar.isPending}
            aria-label="Удалить аватар"
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
