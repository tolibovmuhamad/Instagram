"use client";

import { useEffect, useMemo, useState } from "react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAddStory } from "@/features/stories/hooks";

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
}

export function CreateStoryDialog({ open, onOpenChange, file }: CreateStoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addStory = useAddStory();

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!file || !previewUrl) return null;

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      const compressedBlob = await imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 1920 });
      // browser-image-compression теряет имя файла у результата (см. AvatarUploadDialog) —
      // пересобираем File с явным именем перед отправкой.
      const compressedFile = new File([compressedBlob], "story.jpg", { type: "image/jpeg" });
      await addStory.mutateAsync({ image: compressedFile });
      toast.success("Сторис опубликована");
      onOpenChange(false);
    } catch {
      // ошибка уже показана через axios-интерцептор (toast)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Новая сторис</DialogTitle>
        </DialogHeader>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt="" className="max-h-96 w-full rounded object-contain" />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button type="button" onClick={handlePublish} disabled={isSubmitting}>
            {isSubmitting ? "Публикуем…" : "Опубликовать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
