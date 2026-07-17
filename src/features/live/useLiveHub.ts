"use client";

import { useEffect, useRef } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

import { API_URL } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth";

import type { LiveAccess, LiveGuestRequest } from "./types";

// ⚠️ Единственное место в проекте с сокетами. Обычно у бэкенда realtime нет и всё живёт на
// опросе (см. CLAUDE.md), но у эфиров есть SignalR-хаб LiveHub — через него бэкенд пушит
// события эфира. Полезные (выяснены запросом к хабу 17.07.2026):
//   • GuestApproved         → гостю: publisher-токен после одобрения (иначе его не достать,
//                             REST /Live/join даёт canPublish:false даже одобренному);
//   • GuestRequestReceived  → хосту: новая заявка в гости (чтобы не ждать опрос 5 c);
//   • ViewerJoined / viewercount / StreamEnded — пока не используем.
// Путь хаба /liveHub и метод JoinStream(streamId) выяснены запросом (в Swagger хабов нет).
const LIVE_HUB_URL = `${API_URL}/liveHub`;

// GuestApproved может прийти в camelCase (как у нас) или PascalCase (зависит от сериализатора
// SignalR на бэке) — читаем оба варианта, чтобы не зависеть от этого.
function normalizeAccess(payload: unknown): LiveAccess | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const token = p.token ?? p.Token;
  const serverUrl = p.serverUrl ?? p.ServerUrl;
  const roomName = p.roomName ?? p.RoomName;
  const streamId = p.streamId ?? p.StreamId;
  if (typeof token !== "string" || typeof serverUrl !== "string") return null;
  return {
    streamId: Number(streamId),
    roomName: typeof roomName === "string" ? roomName : "",
    token,
    serverUrl,
  };
}

function normalizeGuestRequest(payload: unknown): LiveGuestRequest | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const requestId = p.requestId ?? p.RequestId;
  if (requestId == null) return null;
  return payload as LiveGuestRequest;
}

export interface LiveHubHandlers {
  /** Гостю одобрили заявку — пришёл publisher-токен, пора включать камеру. */
  onGuestApproved?: (access: LiveAccess) => void;
  /** Хосту прилетела новая заявка в гости. */
  onGuestRequestReceived?: (request: LiveGuestRequest) => void;
}

/**
 * Одно соединение с LiveHub на экран эфира. Пока `enabled` — держим сокет и раздаём события
 * подписанным обработчикам по роли. Обработчики читаются через ref, чтобы соединение не
 * пересобиралось на каждый ререндер родителя.
 */
export function useLiveHub(streamId: number, enabled: boolean, handlers: LiveHubHandlers) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    // Хаб под [Authorize]: без токена подключаться незачем.
    if (!useAuthStore.getState().accessToken) return;

    const connection = new HubConnectionBuilder()
      .withUrl(LIVE_HUB_URL, {
        // Всегда берём свежий токен: наш access живёт 15 минут и ротируется рефрешем.
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("GuestApproved", (payload: unknown) => {
      const access = normalizeAccess(payload);
      // Событие адресное, но на всякий случай сверяем эфир (вдруг заявок несколько).
      if (access && access.streamId === streamId) handlersRef.current.onGuestApproved?.(access);
    });

    connection.on("GuestRequestReceived", (payload: unknown) => {
      const request = normalizeGuestRequest(payload);
      if (request) handlersRef.current.onGuestRequestReceived?.(request);
    });

    let active = true;
    // Групповые события эфира (заявки, зрители) ходят через группу — входим в неё методом
    // JoinStream. Метод может отсутствовать/не пустить — глушим: GuestApproved адресный и
    // приходит без группы.
    const joinGroup = () => {
      connection.invoke("JoinStream", streamId).catch(() => {});
    };
    connection.onreconnected(() => {
      if (active) joinGroup();
    });

    // Провал подключения к хабу не ломает эфир — просто realtime не будет, останется опрос.
    connection
      .start()
      .then(() => {
        if (active) joinGroup();
      })
      .catch(() => {});

    return () => {
      active = false;
      void connection.stop();
    };
  }, [streamId, enabled]);
}
