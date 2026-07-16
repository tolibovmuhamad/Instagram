"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { SearchBox } from "@/components/search/SearchBox";

interface SearchPanelProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Выдвижная панель поиска десктопного Instagram: выезжает из-за рейла, поверх контента.
 * Сетки здесь нет намеренно — «Интересное» это отдельный пункт со своей сеткой, а дубль
 * популярного в поиске мы как раз убирали (см. CLAUDE.md про поиск и «Интересное»).
 */
export function SearchPanel({ open, onClose }: SearchPanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Клик мимо панели закрывает её. Оверлей ниже рейла по z, чтобы рейл оставался
              кликабельным: в Instagram при открытом поиске навигация продолжает работать. */}
          <motion.div
            key="overlay"
            className="fixed inset-0 z-30 hidden md:block"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />

          <motion.aside
            key="panel"
            aria-label="Поиск"
            className="fixed inset-y-0 left-[72px] z-40 hidden w-[397px] flex-col border-r bg-background shadow-xl md:flex"
            initial={{ x: -397, opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -397, opacity: 0.6 }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
          >
            <div className="flex flex-col gap-6 overflow-y-auto px-4 pt-6 pb-4">
              <h1 className="px-1 text-2xl font-semibold">Поиск</h1>
              <SearchBox autoFocus onNavigate={onClose} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
