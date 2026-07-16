"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSettingsPrefs } from "@/store/settings-prefs";

import { PanelIntro, SettingRow } from "./_shared";

export function HiddenWordsPanel() {
  const enabled = useSettingsPrefs((state) => state.hiddenWordsEnabled);
  const setEnabled = useSettingsPrefs((state) => state.setHiddenWordsEnabled);
  const words = useSettingsPrefs((state) => state.hiddenWords);
  const addWord = useSettingsPrefs((state) => state.addHiddenWord);
  const removeWord = useSettingsPrefs((state) => state.removeHiddenWord);

  const [draft, setDraft] = useState("");

  const submit = () => {
    const value = draft.trim();
    if (!value) return;
    addWord(value);
    setDraft("");
  };

  return (
    <div className="max-w-2xl">
      <PanelIntro>
        Комментарии и сообщения-запросы, содержащие эти слова или фразы, будут автоматически скрыты.
      </PanelIntro>

      <SettingRow
        title="Скрывать комментарии с определёнными словами"
        control={
          <Switch
            checked={enabled}
            aria-label="Скрывать комментарии с определёнными словами"
            onCheckedChange={setEnabled}
          />
        }
      />

      <div className="mt-6">
        <label htmlFor="hidden-word" className="mb-2 block text-sm font-medium">
          Пользовательский список слов
        </label>
        <div className="flex gap-2">
          <input
            id="hidden-word"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
            placeholder="Добавьте слово или фразу"
            className="h-10 flex-1 rounded-lg bg-muted px-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="button" onClick={submit} disabled={!draft.trim()}>
            Добавить
          </Button>
        </div>

        {words.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {words.map((word) => (
              <span
                key={word}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm"
              >
                {word}
                <button
                  type="button"
                  aria-label={`Удалить «${word}»`}
                  onClick={() => removeWord(word)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
