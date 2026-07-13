export interface ChatSummary {
  chatId: number;
  sendUserId: string;
  sendUserName: string;
  sendUserImage: string | null;
  receiveUserId: string;
  receiveUserName: string;
  receiveUserImage: string | null;
}

export interface ChatMessage {
  messageId: number;
  chatId: number;
  userId: string;
  userName: string;
  userImage: string | null;
  messageText: string | null;
  sendMassageDate: string;
  file: string | null;
}
