export type Gender = "Male" | "Female";

export interface UserProfile {
  userName: string;
  image: string | null;
  dateUpdated: string;
  gender: Gender;
  postCount: number;
  subscribersCount: number;
  subscriptionsCount: number;
  firstName: string;
  lastName: string;
  locationId: number;
  dob: string;
  occupation: string;
  about: string;
}

export interface UserProfileWithFollowStatus extends UserProfile {
  isSubscriber: boolean;
}

export interface UserSearchResult {
  id: string;
  avatar: string | null;
  fullName: string;
  subscribersCount: number;
  userName: string;
}

export interface SearchHistoryItem {
  id: number;
  text: string;
}

export interface UserSearchHistoryItem {
  id: number;
  users: UserSearchResult;
}
