import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NoteMusic {
  id: string;
  title: string;
  artist: string;
}

export interface UserNote {
  text: string;
  /** id фона из NOTE_BACKGROUNDS */
  background: string;
  music: NoteMusic | null;
  createdAt: number;
}

interface NotesState {
  notes: Record<string, UserNote>;
  setNote: (userId: string, note: UserNote) => void;
  clearNote: (userId: string) => void;
}

// Бэкенд не имеет модуля «Заметки» (в Swagger его нет), поэтому заметка живёт только
// локально: сохраняется в localStorage по userId. Это осознанный клиентский мок —
// у нас нет способа показать заметку подписчикам без серверной части.
export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: {},
      setNote: (userId, note) =>
        set((state) => ({ notes: { ...state.notes, [userId]: note } })),
      clearNote: (userId) =>
        set((state) => {
          const next = { ...state.notes };
          delete next[userId];
          return { notes: next };
        }),
    }),
    { name: "ig-notes-storage" },
  ),
);
