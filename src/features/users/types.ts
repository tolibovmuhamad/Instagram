export type Gender = "Male" | "Female";

// Бэкенд отдаёт gender числом: 0 — Female, 1 — Male.
export type GenderCode = 0 | 1;

export const GENDER_TO_CODE: Record<Gender, GenderCode> = { Female: 0, Male: 1 };
export const GENDER_FROM_CODE: Record<GenderCode, Gender> = { 0: "Female", 1: "Male" };

export interface UserProfile {
  id: number;
  userId: string;
  userName: string;
  fullName: string;
  about: string | null;
  gender: GenderCode;
  image: string | null;
  postCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isPrivate: boolean;
  isVerified: boolean;
  isRequested: boolean;
}

export interface UserSearchResult {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  avatar: string | null;
  isVerified: boolean;
}

export interface SearchHistoryItem {
  id: number;
  text: string;
}

// /User/get-user-search-histories отдаёт плоскую запись, а не вложенного пользователя:
// {id, searchedUserId, searchedUserName, searchedUserAvatar, createdAt} — проверено
// запросом к API. Вложенного объекта `users` (как было на старом бэкенде) больше нет,
// как и fullName: в истории поиска доступны только ник и аватар.
export interface UserSearchHistoryItem {
  id: number;
  searchedUserId: string;
  searchedUserName: string;
  searchedUserAvatar: string | null;
  createdAt: string;
}
