"use client";

import { useEffect, useMemo, useState } from "react";
import imageCompression from "browser-image-compression";
import { Globe, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAddStory } from "@/features/stories/hooks";
import type { StoryAudience } from "@/features/stories/types";
import { cn } from "@/lib/utils";

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
}

const AUDIENCE_OPTIONS: {
  value: StoryAudience;
  label: string;
  hint: string;
  icon: typeof Globe;
}[] = [
  { value: 0, label: "Ваша история", hint: "Её увидят все подписчики", icon: Globe },
  { value: 1, label: "Близкие друзья", hint: "Только список близких друзей", icon: Star },
];

export function CreateStoryDialog({ open, onOpenChange, file }: CreateStoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audience, setAudience] = useState<StoryAudience>(0);
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
      await addStory.mutateAsync({ image: compressedFile, audience });
      toast.success("Сторис опубликована");
      onOpenChange(false);
    } catch {
      // ошибка уже показана через axios-интерцептор (toast)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Во время публикации закрыть диалог нельзя.
        if (isSubmitting) return;
        // Сбрасываем выбор аудитории при закрытии — следующая история начинается с «Все».
        if (!next) setAudience(0);
        onOpenChange(next);
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-sm">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle>Новая история</DialogTitle>
        </DialogHeader>

        {/* Превью 9:16 на тёмном фоне, как настоящий редактор историй. */}
        <div className="relative aspect-[9/16] max-h-[60vh] w-full bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="size-full object-contain" />

          {/* Оверлей загрузки в стиле Instagram: затемнение + спиннер + подпись. */}
          {isSubmitting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm">
              <Loader2 className="size-10 animate-spin text-white" />
              <p className="text-sm font-medium text-white">Публикуем историю…</p>
              <div className="h-1 w-40 overflow-hidden rounded-full bg-white/25">
                <div className="h-full w-1/3 animate-[story-loading-bar_1.1s_ease-in-out_infinite] rounded-full bg-white" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          {/* Выбор аудитории: вся история или только близкие друзья. */}
          <div className="grid grid-cols-2 gap-2">
            {AUDIENCE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = audience === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setAudience(option.value)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors disabled:opacity-50",
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <Icon
                      className={cn("size-4", option.value === 1 && "text-green-600")}
                    />
                    {option.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{option.hint}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handlePublish}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Публикуем…" : "Поделиться"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
