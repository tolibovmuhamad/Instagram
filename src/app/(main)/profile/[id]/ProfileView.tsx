"use client";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyProfile, useUserProfile } from "@/features/users/hooks";
import { useAuthStore } from "@/store/auth";

export function ProfileView({ userId }: { userId: string }) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isOwnProfile = currentUserId === userId;

  const myProfileQuery = useMyProfile();
  const otherProfileQuery = useUserProfile(isOwnProfile ? "" : userId);

  const isLoading = isOwnProfile ? myProfileQuery.isPending : otherProfileQuery.isPending;
  const isError = isOwnProfile ? myProfileQuery.isError : otherProfileQuery.isError;
  const profile = isOwnProfile ? myProfileQuery.data : otherProfileQuery.data;

  if (isLoading) {
    return (
      <div className="w-full space-y-6 p-6">
        <div className="flex items-center gap-6">
          <Skeleton className="size-24 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return <div className="w-full p-8 text-center text-muted-foreground">Профиль не найден</div>;
  }

  return (
    <div className="w-full">
      <ProfileHeader
        userId={userId}
        profile={profile}
        isOwnProfile={isOwnProfile}
        isSubscriber={isOwnProfile ? undefined : otherProfileQuery.data?.isSubscriber}
      />
      <ProfileTabs userId={userId} isOwnProfile={isOwnProfile} />
    </div>
  );
}
