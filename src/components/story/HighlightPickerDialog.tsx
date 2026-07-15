"use client";

import { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMyStories } from "@/features/stories/hooks";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/utils/image";

interface HighlightPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Уже добавленные в «Актуальное» — их не предлагаем повторно.
  existingIds: number[];
  onConfirm: (storyIds: number[]) => void;
}

export function HighlightPickerDialog({
  open,
  onOpenChange,
  existingIds,
  onConfirm,
}: HighlightPickerDialogProps) {
  const storiesQuery = useMyStories();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Архив = все мои истории; уже добавленные в «Актуальное» исключаем.
  const available = (storiesQuery.data ?? []).filter((story) => !existingIds.includes(story.id));

  const toggle = (storyId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(storyId)) next.delete(storyId);
      else next.add(storyId);
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.size > 0) onConfirm([...selected]);
    setSelected(new Set());
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelected(new Set());
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Выберите из архива</DialogTitle>
        </DialogHeader>

        {storiesQuery.isPending ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Загрузка архива…</p>
        ) : available.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            В архиве нет историй. Сначала опубликуйте историю — она попадёт в архив.
          </p>
        ) : (
          <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto">
            {available.map((story) => {
              const isPicked = selected.has(story.id);
              const url = resolveImageUrl(story.fileName);
              return (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => toggle(story.id)}
                  className={cn(
                    "relative aspect-[9/16] overflow-hidden rounded-md ring-2 transition",
                    isPicked ? "ring-primary" : "ring-transparent",
                  )}
                >
                  {url && (
                    <Image src={url} alt="" fill sizes="120px" className="object-cover" />
                  )}
                  {isPicked && (
                    <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Отмена
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={selected.size === 0}>
            Добавить{selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
