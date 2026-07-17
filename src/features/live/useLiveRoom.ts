"use client";

import { useEffect, useRef, useState } from "react";
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

export interface LiveRoomState {
  /** Видео хоста (и гостей) — то, что показываем зрителю. */
  remoteVideoTracks: { participantId: string; track: RemoteTrack }[];
  isConnected: boolean;
  /** Выводится, а не хранится: состояние «между access и подключением». */
  isConnecting: boolean;
  error: string | null;
  /** Своя камера — для превью у хоста. */
  localVideoTrack: Track | null;
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
  const [localVideoTrack, setLocalVideoTrack] = useState<Track | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!access) return;

    let cancelled = false;
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    const addTrack = (track: RemoteTrack, participant: RemoteParticipant) => {
      if (track.kind !== Track.Kind.Video) return;
      setRemoteVideoTracks((prev) =>
        prev.some((t) => t.participantId === participant.identity)
          ? prev
          : [...prev, { participantId: participant.identity, track }],
      );
    };

    const removeTrack = (_t: RemoteTrack, _p: RemoteTrackPublication, participant: RemoteParticipant) => {
      setRemoteVideoTracks((prev) => prev.filter((t) => t.participantId !== participant.identity));
    };

    room
      .on(RoomEvent.TrackSubscribed, (track, _pub, participant) => addTrack(track, participant))
      .on(RoomEvent.TrackUnsubscribed, (track, pub, participant) => removeTrack(track, pub, participant))
      .on(RoomEvent.ParticipantDisconnected, (participant) =>
        setRemoteVideoTracks((prev) => prev.filter((t) => t.participantId !== participant.identity)),
      )
      .on(RoomEvent.ConnectionStateChanged, (state) =>
        setIsConnected(state === ConnectionState.Connected),
      )
      // Комнату закрывает хост (или вебхук room_finished) — для зрителя это конец эфира.
      .on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setRemoteVideoTracks([]);
      });

    // Состояние трогаем только ПОСЛЕ await — синхронный setState в теле эффекта даёт
    // каскадные ререндеры (и запрещён линтером). «Подключаемся» выводится ниже.
    (async () => {
      try {
        await room.connect(access.serverUrl, access.token);
        if (cancelled) return;
        setError(null);

        if (publish) {
          // Камера/микрофон могут быть запрещены пользователем или заняты — это не повод
          // рвать соединение: показываем причину, эфир остаётся подключённым.
          await room.localParticipant.enableCameraAndMicrophone();
          if (cancelled) return;
          const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
          setLocalVideoTrack(pub?.track ?? null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Не удалось подключиться к эфиру");
      }
    })();

    return () => {
      cancelled = true;
      void room.disconnect();
      roomRef.current = null;
      setRemoteVideoTracks([]);
      setLocalVideoTrack(null);
      setIsConnected(false);
    };
  }, [access, publish]);

  // Доступ есть, соединения ещё нет и ошибки не было — значит подключаемся.
  const isConnecting = !!access && !isConnected && !error;

  return { remoteVideoTracks, isConnected, isConnecting, error, localVideoTrack };
}
