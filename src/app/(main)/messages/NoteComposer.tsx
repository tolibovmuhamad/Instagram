"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, Music, Palette, Search, Smile, Users, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getNoteBackground, MUSIC_TRACKS, NOTE_BACKGROUNDS } from "@/features/notes/data";
import { useMyProfile } from "@/features/users/hooks";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";
import { useNotesStore, type NoteMusic } from "@/store/notes";

const EMOJIS = [
  "😀", "😂", "😍", "🥰", "😎", "🤔", "😢", "😡",
  "👍", "🙏", "🔥", "❤️", "✨", "🎉", "💯", "😭",
  "🥳", "😴", "🤗", "👀", "💀", "🫶", "😅", "🤩",
];

type Panel = "none" | "color" | "music" | "emoji";

const MAX_LEN = 60;

export function NoteComposer({ onClose }: { onClose: () => void }) {
  const userId = useAuthStore((state) => state.user?.id);
  const userName = useAuthStore((state) => state.user?.userName) ?? "";
  const profile = useMyProfile();
  const existing = useNotesStore((state) => (userId ? state.notes[userId] : undefined));
  const setNote = useNotesStore((state) => state.setNote);
  const clearNote = useNotesStore((state) => state.clearNote);

  // Инициализируемся из существующей заметки (компонент монтируется заново при открытии).
  const [text, setText] = useState(existing?.text ?? "");
  const [bgId, setBgId] = useState(existing?.background ?? NOTE_BACKGROUNDS[0].id);
  const [music, setMusic] = useState<NoteMusic | null>(existing?.music ?? null);
  const [panel, setPanel] = useState<Panel>("none");
  const [musicQuery, setMusicQuery] = useState("");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const background = getNoteBackground(bgId);
  const isLight = background.text === "light";

  const filteredTracks = useMemo(() => {
    const query = musicQuery.trim().toLowerCase();
    if (!query) return MUSIC_TRACKS;
    return MUSIC_TRACKS.filter(
      (track) =>
        track.title.toLowerCase().includes(query) || track.artist.toLowerCase().includes(query),
    );
  }, [musicQuery]);

  const canPublish = text.trim().length > 0 || !!music;

  const handlePublish = () => {
    if (!userId || !canPublish) return;
    setNote(userId, { text: text.trim(), background: bgId, music, createdAt: Date.now() });
    onClose();
  };

  const handleDelete = () => {
    if (userId) clearNote(userId);
    onClose();
  };

  const panelButtonClass = (active: boolean) =>
    cn(
      "grid size-10 place-items-center rounded-full border transition-colors",
      active ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
    );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      {/* Верхняя панель. */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <button type="button" onClick={onClose} aria-label="Закрыть">
          <X className="size-6" />
        </button>
        <span className="text-base font-bold">Новая заметка</span>
        <button
          type="button"
          onClick={handlePublish}
          disabled={!canPublish}
          className={cn(
            "text-sm font-semibold text-[#0095f6] transition-opacity",
            canPublish ? "hover:opacity-70" : "cursor-default opacity-40",
          )}
        >
          Опубликовать
        </button>
      </div>

      {/* Основная область. */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center">
          {/* Пузырёк-заметка над аватаром. */}
          <div className="relative z-10 -mb-6">
            <div
              className="relative flex min-w-[150px] max-w-[260px] items-center justify-center rounded-[26px] px-5 py-3 shadow-sm"
              style={{ background: background.style }}
            >
              <input
                value={text}
                onChange={(event) => setText(event.target.value.slice(0, MAX_LEN))}
                placeholder="Поделитесь чем-нибудь…"
                maxLength={MAX_LEN}
                aria-label="Текст заметки"
                className={cn(
                  "w-full bg-transparent text-center text-[15px] outline-none",
                  isLight
                    ? "text-white placeholder:text-white/70"
                    : "text-foreground placeholder:text-muted-foreground",
                )}
              />
              <span
                className="absolute -bottom-1.5 left-6 size-3 rounded-[3px]"
                style={{ background: background.style }}
              />
              <span
                className="absolute -bottom-3.5 left-4 size-1.5 rounded-full"
                style={{ background: background.style }}
              />
            </div>
          </div>

          <Avatar className="size-32 ring-4 ring-background">
            <AvatarImage src={resolveAvatarUrl(profile.data?.image)} alt={userName} />
            <AvatarFallback className="text-3xl">
              {userName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Прикреплённая музыка. */}
          {music && (
            <div className="mt-4 flex max-w-[280px] items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs">
              <Music className="size-3.5 shrink-0" />
              <span className="truncate font-semibold">{music.title}</span>
              <span className="truncate text-muted-foreground">· {music.artist}</span>
              <button
                type="button"
                onClick={() => setMusic(null)}
                aria-label="Убрать музыку"
                className="shrink-0"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Кнопки: эмодзи, музыка, фон. */}
          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              aria-label="Эмодзи"
              onClick={() => setPanel(panel === "emoji" ? "none" : "emoji")}
              className={panelButtonClass(panel === "emoji")}
            >
              <Smile className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Музыка"
              onClick={() => setPanel(panel === "music" ? "none" : "music")}
              className={panelButtonClass(panel === "music")}
            >
              <Music className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Фон заметки"
              onClick={() => setPanel(panel === "color" ? "none" : "color")}
              className={panelButtonClass(panel === "color")}
            >
              <Palette className="size-5" />
            </button>
          </div>

          {/* Панель эмодзи. */}
          {panel === "emoji" && (
            <div className="mt-3 grid max-w-[300px] grid-cols-8 gap-1 rounded-2xl border bg-background p-2 shadow-lg">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setText((value) => (value + emoji).slice(0, MAX_LEN))}
                  className="grid size-8 place-items-center rounded-lg text-lg hover:bg-muted"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Панель фона. */}
          {panel === "color" && (
            <div className="mt-3 flex max-w-[340px] flex-wrap justify-center gap-2.5 rounded-2xl border bg-background p-3 shadow-lg">
              {NOTE_BACKGROUNDS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-label={`Фон ${option.id}`}
                  onClick={() => setBgId(option.id)}
                  className={cn(
                    "size-9 rounded-full border border-black/10 transition-transform hover:scale-110",
                    bgId === option.id && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                  )}
                  style={{ background: option.style }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Аудитория. */}
        <div className="absolute inset-x-0 bottom-6 flex flex-wrap items-center justify-center gap-1.5 px-4 text-sm text-muted-foreground">
          <Users className="size-4" />
          <span>Опубликовано для следующей аудитории:</span>
          <button type="button" className="flex items-center gap-1 font-semibold text-foreground">
            взаимные подписчики
            <ChevronDown className="size-4" />
          </button>
        </div>

        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            className="absolute inset-x-0 bottom-14 mx-auto w-max text-sm font-semibold text-destructive hover:opacity-70"
          >
            Удалить заметку
          </button>
        )}
      </div>

      {/* Экран выбора музыки поверх композера. */}
      {panel === "music" && (
        <div className="absolute inset-0 z-20 flex flex-col bg-background">
          <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
            <button type="button" onClick={() => setPanel("none")} aria-label="Назад">
              <ChevronLeft className="size-6" />
            </button>
            <span className="text-base font-bold">Музыка</span>
          </div>

          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={musicQuery}
                onChange={(event) => setMusicQuery(event.target.value)}
                placeholder="Поиск музыки"
                aria-label="Поиск музыки"
                autoFocus
                className="h-10 w-full rounded-lg bg-muted pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-2 pb-6">
            {filteredTracks.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => {
                  setMusic({ id: track.id, title: track.title, artist: track.artist });
                  setPanel("none");
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
              >
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-md text-white"
                  style={{ background: track.cover }}
                >
                  <Music className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{track.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
                </div>
              </button>
            ))}

            {filteredTracks.length === 0 && (
              <p className="py-16 text-center text-sm text-muted-foreground">Ничего не найдено</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
