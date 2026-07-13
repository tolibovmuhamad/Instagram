export interface FollowUserShortInfo {
  userId: string;
  userName: string;
  userPhoto: string | null;
  fullname: string;
}

export interface FollowRelation {
  id: number;
  userShortInfo: FollowUserShortInfo;
}
