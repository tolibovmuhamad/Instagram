import { apiClient } from "@/lib/api/client";

import type { ChatMessage, ChatSummary } from "./types";

export async function getChats() {
  const { data } = await apiClient.get<ChatSummary[]>("/Chat/get-chats");
  return data;
}

// Возвращает список сообщений чата (новые первыми) — не сам чат.
export async function getChatById(chatId: number) {
  const { data } = await apiClient.get<ChatMessage[]>("/Chat/get-chat-by-id", {
    params: { chatId },
  });
  return data;
}

export async function createChat(receiverUserId: string) {
  const { data } = await apiClient.post<number>("/Chat/create-chat", null, {
    params: { receiverUserId },
  });
  return data;
}

export interface SendMessagePayload {
  chatId: number;
  messageText?: string;
  file?: File;
}

// Бэкенд использует PUT для отправки сообщения (нестандартный глагол, см. CLAUDE.md).
export async function sendMessage(payload: SendMessagePayload) {
  const formData = new FormData();
  formData.append("ChatId", String(payload.chatId));
  if (payload.messageText) formData.append("MessageText", payload.messageText);
  if (payload.file) formData.append("File", payload.file);
  const { data } = await apiClient.put<number>("/Chat/send-message", formData);
  return data;
}

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
