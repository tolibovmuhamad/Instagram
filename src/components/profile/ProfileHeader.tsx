"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import type { UserProfile } from "@/features/users/types";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/utils/image";

import { AvatarEditor } from "./AvatarEditor";
import { EditProfileDialog } from "./EditProfileDialog";
import { FollowButton } from "./FollowButton";
import { FollowListDialog } from "./FollowListDialog";

interface ProfileHeaderProps {
  userId: string;
  profile: UserProfile;
  isOwnProfile: boolean;
  isSubscriber?: boolean;
}

export function ProfileHeader({ userId, profile, isOwnProfile, isSubscriber }: ProfileHeaderProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [followListMode, setFollowListMode] = useState<"subscribers" | "subscriptions" | null>(
    null,
  );
  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");

  return (
    <header className="flex flex-col gap-6 border-b p-6 sm:flex-row sm:items-center">
      {isOwnProfile ? (
        <AvatarEditor image={profile.image} fallback={profile.userName} />
      ) : (
        <Avatar className="size-24">
          <AvatarImage src={resolveImageUrl(profile.image)} alt={profile.userName} />
          <AvatarFallback className="text-2xl">
            {profile.userName.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{profile.userName}</h1>
          {isOwnProfile ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
              >
                Редактировать профиль
              </Button>
              <Link
                href="/settings"
                aria-label="Настройки"
                className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
              >
                <Settings className="size-4" />
              </Link>
            </>
          ) : (
            isSubscriber !== undefined && (
              <FollowButton targetUserId={userId} isSubscriber={isSubscriber} />
            )
          )}
        </div>

        <div className="flex gap-6 text-sm">
          <span>
            <strong>{profile.postCount}</strong> публикаций
          </span>
          <button type="button" onClick={() => setFollowListMode("subscribers")}>
            <strong>{profile.subscribersCount}</strong> подписчиков
          </button>
          <button type="button" onClick={() => setFollowListMode("subscriptions")}>
            <strong>{profile.subscriptionsCount}</strong> подписок
          </button>
        </div>

        <div className="space-y-0.5 text-sm">
          {displayName && <p className="font-medium">{displayName}</p>}
          {profile.occupation && <p className="text-muted-foreground">{profile.occupation}</p>}
          {profile.about && <p className="whitespace-pre-line">{profile.about}</p>}
        </div>
      </div>

      {isOwnProfile && (
        <EditProfileDialog open={isEditOpen} onOpenChange={setIsEditOpen} profile={profile} />
      )}

      {followListMode && (
        <FollowListDialog
          userId={userId}
          mode={followListMode}
          open={!!followListMode}
          onOpenChange={(open) => setFollowListMode(open ? followListMode : null)}
        />
      )}
    </header>
  );
}
