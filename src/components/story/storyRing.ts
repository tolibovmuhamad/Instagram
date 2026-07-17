import type { StoryRing } from "@/features/stories/types";

// Кольцо рисуется как подложка под аватаром (родитель с p-[3px]), поэтому это классы фона.
// Общее место для ленты кружков и аватара профиля — раньше профиль знал только про градиент
// и поэтому кольцо там не гасло.
export const STORY_RING_CLASS: Record<StoryRing, string> = {
  unviewed: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600",
  closeFriends: "bg-green-500",
  viewed: "bg-muted",
  none: "",
};
