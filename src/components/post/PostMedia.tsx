"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useBrokenImage } from "@/lib/hooks/use-broken-image";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/utils/image";
import { isVideoFile } from "@/lib/utils/media";

interface PostMediaProps {
  images: string[];
  alt: string;
  className?: string;
  /**
   * "feed" — карточка ленты Instagram 2026: скруглённые углы с волосяной рамкой,
   * точки карусели под медиа. "detail" — прежний вид для страницы поста:
   * прямые края, точки поверх изображения.
   */
  variant?: "detail" | "feed";
}

export function PostMedia({ images, alt, className, variant = "detail" }: PostMediaProps) {
  const [index, setIndex] = useState(0);
  // Файл мог пропасть с сервера — тогда вместо битой картинки показываем ту же
  // заглушку, что и при полном отсутствии медиа (см. useBrokenImage).
  const { isBroken, imageProps } = useBrokenImage();
  const filename = images[index];
  const url = resolveImageUrl(filename);
  const hasMultiple = images.length > 1;
  const isFeed = variant === "feed";

  if (!url || isBroken(filename)) {
    return (
      <div
        className={cn(
          "flex aspect-square items-center justify-center bg-muted",
          isFeed && "rounded-[4px] border",
          className,
        )}
      >
        <span className="text-sm text-muted-foreground">Нет медиа</span>
      </div>
    );
  }

  const goPrev = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIndex((i) => i - 1);
  };

  const goNext = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIndex((i) => i + 1);
  };

  const media = (
    <div
      className={cn(
        "relative aspect-square overflow-hidden bg-black",
        isFeed && "rounded-[4px] border",
        className,
      )}
    >
      {isVideoFile(filename) ? (
        <video src={url} controls className="h-full w-full object-contain" />
      ) : (
        <Image src={url} alt={alt} fill sizes="600px" className="object-contain" {...imageProps(filename)} />
      )}

      {hasMultiple && (
        <>
          {index > 0 && (
            <button
              type="button"
              aria-label="Предыдущее фото"
              onClick={goPrev}
              className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-white/80 p-1 shadow hover:bg-white"
            >
              <ChevronLeft className="size-4 text-black" />
            </button>
          )}
          {index < images.length - 1 && (
            <button
              type="button"
              aria-label="Следующее фото"
              onClick={goNext}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-white/80 p-1 shadow hover:bg-white"
            >
              <ChevronRight className="size-4 text-black" />
            </button>
          )}
          {!isFeed && (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={cn("size-1.5 rounded-full", i === index ? "bg-white" : "bg-white/50")}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (!isFeed || !hasMultiple) return media;

  return (
    <div>
      {media}
      <div className="mt-3 flex justify-center gap-1.5">
        {images.map((_, i) => (
          <span
            key={i}
            className={cn(
              "size-1.5 rounded-full",
              i === index ? "bg-primary" : "bg-muted-foreground/40",
            )}
          />
        ))}
      </div>
    </div>
  );
}
