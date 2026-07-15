"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Paperclip, SendHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSendMessage, useSendVoiceMessage } from "@/features/chat/hooks";
import { cn } from "@/lib/utils";

// Формат контейнера для MediaRecorder: webm с opus поддерживают все актуальные
// браузеры кроме Safari, для которого падаем на mp4/aac.
function pickAudioMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function formatSeconds(total: number): string {
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

export function MessageForm({ chatId }: { chatId: number }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendMessage = useSendMessage(chatId);
  const sendVoice = useSendVoiceMessage(chatId);

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const shouldSendRef = useRef(false);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Останавливаем поток микрофона и таймер при размонтировании, чтобы индикатор
  // записи в браузере не «завис» после ухода со страницы.
  useEffect(() => {
    return () => {
      stopTimer();
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim() && !file) return;
    sendMessage.mutate(
      { chatId, messageText: text.trim() || undefined, file: file ?? undefined },
      {
        onSuccess: () => {
          setText("");
          setFile(null);
        },
      },
    );
  };

  const startRecording = async () => {
    const mimeType = pickAudioMime();
    if (!mimeType) {
      toast.error("Браузер не поддерживает запись голосовых сообщений");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      shouldSendRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const elapsed = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const shouldSend = shouldSendRef.current;
        setIsRecording(false);
        setSeconds(0);
        if (!shouldSend) return;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size === 0) return;
        const ext = mimeType.includes("mp4") ? "m4a" : "webm";
        const voiceFile = new File([blob], `voice-${Date.now()}.${ext}`, { type: mimeType });
        sendVoice.mutate({ chatId, file: voiceFile, duration: elapsed });
      };

      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start();
      setIsRecording(true);
      setSeconds(0);
      stopTimer();
      timerRef.current = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    } catch {
      toast.error("Нет доступа к микрофону");
    }
  };

  const finishRecording = (send: boolean) => {
    shouldSendRef.current = send;
    stopTimer();
    recorderRef.current?.stop();
  };

  const hasText = text.trim().length > 0;

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 border-t p-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => finishRecording(false)}
          aria-label="Отменить запись"
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
        <div className="flex flex-1 items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2.5 animate-pulse rounded-full bg-destructive" aria-hidden />
          <span className="tabular-nums">{formatSeconds(seconds)}</span>
          <span>Идёт запись…</span>
        </div>
        <Button
          type="button"
          size="icon"
          onClick={() => finishRecording(true)}
          disabled={sendVoice.isPending}
          aria-label="Отправить голосовое сообщение"
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-3">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Прикрепить файл"
      >
        <Paperclip className="size-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <Input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={file ? file.name : "Сообщение…"}
        aria-label="Текст сообщения"
        className="flex-1"
      />
      {hasText || file ? (
        <Button
          type="submit"
          size="icon"
          disabled={sendMessage.isPending}
          aria-label="Отправить"
        >
          <SendHorizontal className="size-4" />
        </Button>
      ) : (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={startRecording}
          className={cn(sendVoice.isPending && "opacity-50")}
          disabled={sendVoice.isPending}
          aria-label="Записать голосовое сообщение"
        >
          <Mic className="size-4" />
        </Button>
      )}
    </form>
  );
}
