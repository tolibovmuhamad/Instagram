import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createChat,
  deleteChat,
  deleteMessage,
  getChatById,
  getChats,
  sendMessage,
} from "./api";

export const chatKeys = {
  list: ["chats", "list"] as const,
  messages: (chatId: number) => ["chats", "messages", chatId] as const,
};

// На бэкенде нет SignalR/WebSocket — «реалтайм» реализован через периодический опрос
// (см. CLAUDE.md). Список чатов обновляется реже сообщений внутри открытого диалога.
const CHAT_LIST_POLL_MS = 8000;
const MESSAGES_POLL_MS = 3000;

export function useChats() {
  return useQuery({
    queryKey: chatKeys.list,
    queryFn: getChats,
    refetchInterval: CHAT_LIST_POLL_MS,
  });
}

export function useChatMessages(chatId: number) {
  return useQuery({
    queryKey: chatKeys.messages(chatId),
    queryFn: () => getChatById(chatId),
    enabled: !!chatId,
    refetchInterval: MESSAGES_POLL_MS,
  });
}

export function useCreateChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list });
    },
  });
}

export function useSendMessage(chatId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.list });
    },
  });
}

export function useDeleteMessage(chatId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(chatId) });
    },
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list });
    },
  });
}
