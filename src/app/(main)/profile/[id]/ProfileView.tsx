"use client";

import { Lock } from "lucide-react";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyProfile, useUserProfile } from "@/features/users/hooks";
import { useAuthStore } from "@/store/auth";

// Закрытый аккаунт: не подписан и это не вы — публикации, актуальное и истории скрыты,
// как в оригинальном Instagram. Виден только сам профиль (шапка, счётчики, описание).
function PrivateAccountNotice() {
  return (
    <div className="mx-auto w-full max-w-[935px] border-t">
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-full border-2 border-foreground">
          <Lock className="size-7" strokeWidth={1.75} />
        </span>
        <h2 className="text-lg font-semibold">Это закрытый аккаунт</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          Подпишитесь, чтобы видеть его фото и видео.
        </p>
      </div>
    </div>
  );
}

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
      <div className="mx-auto w-full max-w-[935px] space-y-6 p-6">
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

  // Закрытый чужой аккаунт без активной подписки — контент скрыт.
  const isLocked = !isOwnProfile && profile.isPrivate && !profile.isFollowing;

  return (
    <div className="mx-auto w-full max-w-[935px]">
      <ProfileHeader userId={userId} profile={profile} isOwnProfile={isOwnProfile} />
      {isLocked ? (
        <PrivateAccountNotice />
      ) : (
        <ProfileTabs userId={userId} isOwnProfile={isOwnProfile} />
      )}
    </div>
  );
}
