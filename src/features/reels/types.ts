import type { Post } from "@/features/posts/types";

// /Post/get-reels отдаёт тот же самый DTO, что и /Post/get-posts — это обычные посты,
// отфильтрованные по флагу isReel. Отдельная структура больше не нужна, но имя Reel
// оставлено: по нему называются экран и хуки.
export type Reel = Post;
