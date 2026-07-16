"use client";

import { Bookmark, Eye, Heart, MessageCircle, Repeat2 } from "lucide-react";

import { cn } from "@/lib/utils";

const numberFormat = new Intl.NumberFormat("ru-RU");

interface PostInsightsProps {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  /** Сохранил ли текущий пользователь пост (общего счётчика сохранений API не отдаёт). */
  isFavorite: boolean;
  className?: string;
}

// Статистика публикации для её автора — как экран «Статистика» в Instagram.
// Реальные данные с бэкенда: viewCount, likeCount, commentCount (проверено запросами).
// Общих счётчиков «сохранений» и «репостов» в API нет — сервер отдаёт только флаг
// isFavorite (сохранил ли пост ТЫ), поэтому эти метрики показываем как недоступные (—),
// а не выдумываем число.
export function PostInsights({
  viewCount,
  likeCount,
  commentCount,
  isFavorite,
  className,
}: PostInsightsProps) {
  const metrics: {
    icon: typeof Eye;
    value: string;
    label: string;
    muted?: boolean;
    title?: string;
  }[] = [
    { icon: Eye, value: numberFormat.format(viewCount), label: "Просмотры" },
    { icon: Heart, value: numberFormat.format(likeCount), label: "Нравится" },
    { icon: MessageCircle, value: numberFormat.format(commentCount), label: "Комментарии" },
    {
      icon: Bookmark,
      value: isFavorite ? "1+" : "—",
      label: "Сохранения",
      muted: true,
      title: "API не отдаёт общее число сохранений — только то, сохранили ли вы сами",
    },
    {
      icon: Repeat2,
      value: "—",
      label: "Репосты",
      muted: true,
      title: "API не отдаёт число репостов публикации",
    },
  ];

  return (
    <div className={cn("rounded-xl border p-3", className)}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Статистика публикации
      </p>
      <div className="grid grid-cols-3 gap-y-4 sm:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              title={metric.title}
              className="flex flex-col items-center gap-1 text-center"
            >
              <Icon
                className={cn("size-5", metric.muted ? "text-muted-foreground" : "text-foreground")}
              />
              <span className="text-base font-bold leading-none">{metric.value}</span>
              <span className="text-[11px] leading-tight text-muted-foreground">{metric.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
