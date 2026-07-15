import { apiClient } from "@/lib/api/client";

import type { ChatDetail, ChatMessage, ChatSummary } from "./types";

export async function getChats() {
  const { data } = await apiClient.get<ChatSummary[]>("/Chat/get-chats");
  return data;
}

// Возвращает чат целиком — собеседника и его сообщения одним объектом.
export async function getChatById(chatId: number) {
  const { data } = await apiClient.get<ChatDetail>("/Chat/get-chat-by-id", {
    params: { chatId },
  });
  return data;
}

export async function createChat(receiverUserId: string) {
  const { data } = await apiClient.post<ChatSummary>("/Chat/create-chat", null, {
    params: { receiverUserId },
  });
  return data;
}

export interface SendMessagePayload {
  chatId: number;
  messageText?: string;
  file?: File;
  replyToMessageId?: number;
}

// Бэкенд использует PUT для отправки сообщения (нестандартный глагол, см. CLAUDE.md).
export async function sendMessage(payload: SendMessagePayload) {
  const formData = new FormData();
  formData.append("ChatId", String(payload.chatId));
  if (payload.messageText) formData.append("MessageText", payload.messageText);
  if (payload.file) formData.append("File", payload.file);
  if (payload.replyToMessageId) {
    formData.append("ReplyToMessageId", String(payload.replyToMessageId));
  }
  const { data } = await apiClient.put<ChatMessage>("/Chat/send-message", formData);
  return data;
}

export interface SendVoicePayload {
  chatId: number;
  file: File;
  // Длительность записи в секундах — бэкенд ждёт целое число (int32).
  duration: number;
  replyToMessageId?: number;
}

// Голосовое сообщение отправляется отдельным эндпоинтом /Message/send-voice
// (multipart/form-data). Context=0 — личный чат (MessageContext.Direct), 1 — группа.
export async function sendVoiceMessage(payload: SendVoicePayload) {
  const formData = new FormData();
  formData.append("Context", "0");
  formData.append("ChatId", String(payload.chatId));
  formData.append("File", payload.file);
  formData.append("Duration", String(Math.round(payload.duration)));
  if (payload.replyToMessageId) {
    formData.append("ReplyToMessageId", String(payload.replyToMessageId));
  }
  const { data } = await apiClient.post<ChatMessage>("/Message/send-voice", formData);
  return data;
}

// Реакция-эмодзи на сообщение. Бэкенд сам делает toggle: тот же эмодзи снимает
// реакцию, другой — заменяет. Context=0 — личный чат. Все параметры — query.
export async function reactToMessage(payload: { messageId: number; emoji: string }) {
  const { data } = await apiClient.post<unknown>("/Message/react", null, {
    params: { messageId: payload.messageId, context: 0, emoji: payload.emoji },
  });
  return data;
}

// Пересылка сообщения в другой чат («Переслано»). context — контекст исходного чата,
// targetContext — целевого; для личных диалогов оба равны 0. Все параметры — query.
export async function forwardMessage(payload: { messageId: number; targetChatId: number }) {
  const { data } = await apiClient.post<unknown>("/Message/forward", null, {
    params: {
      messageId: payload.messageId,
      context: 0,
      targetChatId: payload.targetChatId,
      targetContext: 0,
    },
  });
  return data;
}

// Опечатка massageId — на стороне бэкенда, повторяем как есть.
export async function deleteMessage(messageId: number) {
  const { data } = await apiClient.delete<boolean>("/Chat/delete-message", {
    params: { massageId: messageId },
  });
  return data;
}

export async function deleteChat(chatId: number) {
  const { data } = await apiClient.delete<boolean>("/Chat/delete-chat", { params: { chatId } });
  return data;
}
