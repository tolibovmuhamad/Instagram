"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Eye, Heart, Info, Send } from "lucide-react";

import { plural } from "@/lib/utils/plural";

interface StoryStatsSheetProps {
  open: boolean;
  onClose: () => void;
  viewCount: number;
  likeCount: number;
}

// Нижняя «шторка» (bottom sheet) со статистикой своей истории — выезжает снизу вверх,
// как экран «Просмотрели» в Instagram. Бэкенд отдаёт только счётчики (проверено запросами:
// списка конкретных зрителей/лайков в API нет), поэтому показываем честные числа.
export function StoryStatsSheet({ open, onClose, viewCount, likeCount }: StoryStatsSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-md rounded-t-2xl bg-background p-5 pb-8 shadow-2xl"
            role="dialog"
            aria-label="Статистика истории"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-muted-foreground/30" />

            <h3 className="mb-4 text-center text-base font-semibold">Статистика истории</h3>

            <div className="flex items-stretch gap-3">
              <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-muted/60 py-5">
                <Eye className="size-6 text-foreground" />
                <span className="text-2xl font-bold">{viewCount}</span>
                <span className="text-xs text-muted-foreground">
                  {plural(viewCount, ["просмотр", "просмотра", "просмотров"])}
                </span>
              </div>
              <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-muted/60 py-5">
                <Heart className="size-6 text-rose-500" />
                <span className="text-2xl font-bold">{likeCount}</span>
                <span className="text-xs text-muted-foreground">
                  {plural(likeCount, ["отметка", "отметки", "отметок"])} «Нравится»
                </span>
              </div>
            </div>

            {/* Ответы на историю приходят в Директ — там видно, кто именно написал. */}
            <Link
              href="/messages"
              onClick={onClose}
              className="mt-4 flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
                <Send className="size-4" />
              </span>
              <span className="flex-1 text-sm">
                <span className="font-medium">Ответы на историю</span>
                <span className="block text-xs text-muted-foreground">
                  Приходят в Директ — там видно, кто ответил
                </span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>

            <p className="mt-3 flex items-start gap-2 rounded-xl bg-muted/40 p-3 text-xs leading-snug text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Сервер предоставляет только счётчики просмотров и «Нравится» — поимённого
              списка зрителей у этого API нет.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
