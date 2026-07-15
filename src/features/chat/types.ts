// 0 — текст/файл, 1 — голосовое сообщение (/Message/send-voice).
export type MessageType = 0 | 1;

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface ChatMessage {
  id: number;
  chatId: number;
  senderUserId: string;
  messageText: string | null;
  fileName: string | null;
  createdAt: string;
  isRead: boolean;
  messageType: MessageType;
  duration: number | null;
  waveform: number[] | null;
  replyToMessageId: number | null;
  replyTo: ChatMessage | null;
  isForwarded: boolean;
  reactions: MessageReaction[];
}

// Собеседник, а не «отправитель/получатель»: бэкенд сам определяет вторую сторону
// относительно текущего пользователя.
export interface ChatSummary {
  id: number;
  userId: string;
  userName: string;
  userImage: string | null;
  lastMessage: string | null;
  lastMessageDate: string | null;
  unreadCount: number;
}

export interface ChatDetail extends ChatSummary {
  messages: ChatMessage[];
}
