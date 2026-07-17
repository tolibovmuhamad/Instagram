"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionState,
  RemoteTrack,
  RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
  type RemoteParticipant,
} from "livekit-client";

import type { LiveAccess } from "./types";

// Всё общение с LiveKit заперто здесь: компоненты видят только готовые видео/аудио-треки и
// состояние подключения. Само видео идёт мимо нашего API — бэкенд лишь выдаёт токен.
//
// Room создаётся ОДИН раз на подключение и живёт в ref: пересоздание на ререндере рвало бы
// эфир. Отключение обязательно в cleanup — иначе зритель остаётся в комнате после ухода
// со страницы, и хост продолжает видеть его в списке.

// Камера/микрофон могут не включиться с первого раза: сразу после превью на /live/start
// устройство на Windows ещё занято и getUserMedia падает NotReadableError. Это НЕ повод
// рвать эфир — держим соединение и повторяем несколько раз с паузой.
const CAMERA_RETRIES = 4;
const CAMERA_RETRY_DELAY_MS = 700;

export interface LiveRoomState {
  /** Видео хоста (и гостей) — то, что показываем зрителю. */
  remoteVideoTracks: { participantId: string; track: RemoteTrack }[];
  /** Аудио хоста (и гостей) — привязываем к <audio>, иначе зрители не слышат голос. */
  remoteAudioTracks: { participantId: string; track: RemoteTrack }[];
  isConnected: boolean;
  /** Выводится, а не хранится: состояние «между access и подключением». */
  isConnecting: boolean;
  /** Не удалось подключиться к комнате LiveKit — эфира нет вообще. */
  error: string | null;
  /** Подключены, но не удалось включить камеру/микрофон хоста — эфир идёт без видео. */
  cameraError: string | null;
  /** Своя камера — для превью у хоста. */
  localVideoTrack: Track | null;
  /** Повторить включение камеры вручную (после отказа/занятости устройства). */
  retryCamera: () => void;
}

interface Options {
  access: LiveAccess | null;
  /** true — публикуем камеру и микрофон (хост/гость), false — только смотрим. */
  publish: boolean;
}

export function useLiveRoom({ access, publish }: Options): LiveRoomState {
  const roomRef = useRef<Room | null>(null);
  const [remoteVideoTracks, setRemoteVideoTracks] = useState<
    { participantId: string; track: RemoteTrack }[]
  >([]);
  const [remoteAudioTracks, setRemoteAudioTracks] = useState<
    { participantId: string; track: RemoteTrack }[]
  >([]);
  const [localVideoTrack, setLocalVideoTrack] = useState<Track | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Включаем камеру с повторами: если устройство ещё занято превью, первая попытка падает,
  // но через доли секунды освобождается. Соединение при этом не трогаем — эфир жив.
  const enableCamera = useCallback(
    async (room: Room, isCancelled: () => boolean) => {
      for (let attempt = 0; attempt < CAMERA_RETRIES; attempt++) {
        try {
          await room.localParticipant.enableCameraAndMicrophone();
          if (isCancelled()) return;
          const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
          setLocalVideoTrack(pub?.track ?? null);
          setCameraError(null);
          return;
        } catch (e) {
          if (isCancelled()) return;
          if (attempt < CAMERA_RETRIES - 1) {
            await new Promise((resolve) => setTimeout(resolve, CAMERA_RETRY_DELAY_MS));
            if (isCancelled()) return;
            continue;
          }
          // Все попытки исчерпаны — сообщаем причину, но эфир (соединение) остаётся живым.
          setCameraError(
            e instanceof Error ? e.message : "Не удалось включить камеру и микрофон",
          );
        }
      }
    },
    [],
  );

  // Ручной повтор: пользователь освободил камеру/разрешил доступ и жмёт «Повторить».
  const retryCamera = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    setCameraError(null);
    void enableCamera(room, () => roomRef.current !== room);
  }, [enableCamera]);

  useEffect(() => {
    if (!access) return;

    let cancelled = false;
    const isCancelled = () => cancelled;
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    // Видео уходит в <video>, аудио — в <audio>. Раньше аудио отбрасывалось здесь, и голос
    // ведущего до зрителей просто не доходил (трек подписан, но никуда не подключён).
    const addTrack = (track: RemoteTrack, participant: RemoteParticipant) => {
      const setter =
        track.kind === Track.Kind.Video
          ? setRemoteVideoTracks
          : track.kind === Track.Kind.Audio
            ? setRemoteAudioTracks
            : null;
      if (!setter) return;
      setter((prev) =>
        prev.some((t) => t.participantId === participant.identity)
          ? prev
          : [...prev, { participantId: participant.identity, track }],
      );
    };

    const removeTrack = (track: RemoteTrack, _p: RemoteTrackPublication, participant: RemoteParticipant) => {
      const setter =
        track.kind === Track.Kind.Video
          ? setRemoteVideoTracks
          : track.kind === Track.Kind.Audio
            ? setRemoteAudioTracks
            : null;
      if (!setter) return;
      setter((prev) => prev.filter((t) => t.participantId !== participant.identity));
    };

    // Браузер может заблокировать автозапуск звука до жеста пользователя — тогда видео
    // идёт, а голоса нет. Ловим это событие и включаем звук по первому клику/тапу.
    const resumeAudioOnGesture = () => {
      void room.startAudio();
    };

    room
      .on(RoomEvent.TrackSubscribed, (track, _pub, participant) => addTrack(track, participant))
      .on(RoomEvent.TrackUnsubscribed, (track, pub, participant) => removeTrack(track, pub, participant))
      .on(RoomEvent.ParticipantDisconnected, (participant) => {
        setRemoteVideoTracks((prev) => prev.filter((t) => t.participantId !== participant.identity));
        setRemoteAudioTracks((prev) => prev.filter((t) => t.participantId !== participant.identity));
      })
      .on(RoomEvent.ConnectionStateChanged, (state) =>
        setIsConnected(state === ConnectionState.Connected),
      )
      .on(RoomEvent.AudioPlaybackStatusChanged, () => {
        if (!room.canPlaybackAudio) {
          document.addEventListener("pointerdown", resumeAudioOnGesture, { once: true });
        }
      })
      // Комнату закрывает хост (или вебхук room_finished) — для зрителя это конец эфира.
      .on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setRemoteVideoTracks([]);
        setRemoteAudioTracks([]);
      });

    // Состояние трогаем только ПОСЛЕ await — синхронный setState в теле эффекта даёт
    // каскадные ререндеры (и запрещён линтером). «Подключаемся» выводится ниже.
    (async () => {
      try {
        await room.connect(access.serverUrl, access.token);
        if (cancelled) return;
        setError(null);

        // Публикация камеры вынесена в enableCamera (с повторами) и НЕ входит в этот
        // try: её провал — это cameraError, а не разрыв соединения. Иначе занятая камера
        // выглядела бы как «эфир не подключился», хотя зрители уже в комнате.
        if (publish) await enableCamera(room, isCancelled);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Не удалось подключиться к эфиру");
      }
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("pointerdown", resumeAudioOnGesture);
      void room.disconnect();
      roomRef.current = null;
      setRemoteVideoTracks([]);
      setRemoteAudioTracks([]);
      setLocalVideoTrack(null);
      setIsConnected(false);
      setCameraError(null);
    };
  }, [access, publish, enableCamera]);

  // Доступ есть, соединения ещё нет и ошибки не было — значит подключаемся.
  const isConnecting = !!access && !isConnected && !error;

  return { remoteVideoTracks, remoteAudioTracks, isConnected, isConnecting, error, cameraError, localVideoTrack, retryCamera };
}
