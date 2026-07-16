// Настройки приватности с бэкенда (/Settings/get-privacy, /Settings/update-privacy).
// В Swagger у модуля нет схемы ответа (content?: never), но тело запроса описано как
// UpdatePrivacySettingsDto — по нему и восстановлены поля. Смысл числовых enum'ов в
// Swagger не расшифрован, поэтому подписи выбраны по аналогии с оригинальным Instagram.

export type WhoCanMessage = 0 | 1 | 2;
export type WhoCanMention = 0 | 1 | 2;
export type WhoCanReplyStory = 0 | 1 | 2 | 3;

export interface PrivacySettings {
  isPrivate: boolean;
  showOnlineStatus: boolean;
  whoCanMessage: WhoCanMessage;
  whoCanMention: WhoCanMention;
  whoCanReplyStory: WhoCanReplyStory;
}

export const WHO_CAN_MESSAGE_OPTIONS: { value: WhoCanMessage; label: string }[] = [
  { value: 0, label: "Все" },
  { value: 1, label: "Только подписчики" },
  { value: 2, label: "Никто" },
];

export const WHO_CAN_MENTION_OPTIONS: { value: WhoCanMention; label: string }[] = [
  { value: 0, label: "Все" },
  { value: 1, label: "Люди, на которых вы подписаны" },
  { value: 2, label: "Никто" },
];

export const WHO_CAN_REPLY_STORY_OPTIONS: { value: WhoCanReplyStory; label: string }[] = [
  { value: 0, label: "Все" },
  { value: 1, label: "Подписчики, на которых вы подписаны" },
  { value: 2, label: "Люди, на которых вы подписаны" },
  { value: 3, label: "Никто" },
];
