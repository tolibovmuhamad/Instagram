"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/utils/image";
import { isVideoFile } from "@/lib/utils/media";

interface PostMediaProps {
  images: string[];
  alt: string;
  className?: string;
}

export function PostMedia({ images, alt, className }: PostMediaProps) {
  const [index, setIndex] = useState(0);
  const filename = images[index];
  const url = resolveImageUrl(filename);
  const hasMultiple = images.length > 1;

  if (!url) {
    return (
      <div className={cn("flex aspect-square items-center justify-center bg-muted", className)}>
        <span className="text-sm text-muted-foreground">Нет медиа</span>
      </div>
    );
  }

  return (
    <div className={cn("relative aspect-square overflow-hidden bg-black", className)}>
      {isVideoFile(filename) ? (
        <video src={url} controls className="h-full w-full object-contain" />
      ) : (
        <Image src={url} alt={alt} fill sizes="600px" className="object-contain" />
      )}

      {hasMultiple && (
        <>
          {index > 0 && (
            <button
              type="button"
              aria-label="Предыдущее фото"
              onClick={() => setIndex((i) => i - 1)}
              className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-white/80 p-1 shadow hover:bg-white"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}
          {index < images.length - 1 && (
            <button
              type="button"
              aria-label="Следующее фото"
              onClick={() => setIndex((i) => i + 1)}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-white/80 p-1 shadow hover:bg-white"
            >
              <ChevronRight className="size-4" />
            </button>
          )}
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-1.5 rounded-full",
                  i === index ? "bg-white" : "bg-white/50",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
