"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useStories } from "@/features/stories/hooks";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

import { CreateStoryDialog } from "./CreateStoryDialog";
import { StoryViewer } from "./StoryViewer";

export function StoryAvatarRail() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const storiesQuery = useStories();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewerGroupIndex, setViewerGroupIndex] = useState<number | null>(null);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<number>>(new Set());
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const groups = storiesQuery.data ?? [];
  const ownGroup = groups.find((group) => group.userId === currentUserId);

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPickedFile(file);
      setIsCreateOpen(true);
    }
    event.target.value = "";
  };

  const markViewed = (storyId: number) => {
    setViewedStoryIds((prev) => new Set(prev).add(storyId));
  };

  const isGroupUnviewed = (groupIndex: number) =>
    groups[groupIndex].stories.some((story) => !viewedStoryIds.has(story.id));

  if (storiesQuery.isPending) {
    return (
      <div className="flex gap-4 overflow-x-auto p-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="size-16 shrink-0 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto border-b p-4">
      <div className="flex shrink-0 flex-col items-center gap-1">
        <div
          className={cn(
            "relative flex size-16 items-center justify-center rounded-full p-0.5",
            ownGroup && ownGroup.stories.length > 0
              ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
              : "bg-muted",
          )}
        >
          {ownGroup && ownGroup.stories.length > 0 ? (
            <button
              type="button"
              aria-label="Открыть вашу сторис"
              onClick={() => setViewerGroupIndex(groups.indexOf(ownGroup))}
              className="size-full"
            >
              <Avatar className="size-full border-2 border-background">
                <AvatarImage src={resolveImageUrl(ownGroup.userImage)} alt="Ваша сторис" />
                <AvatarFallback>Я</AvatarFallback>
              </Avatar>
            </button>
          ) : (
            <Avatar className="size-full border-2 border-background">
              <AvatarFallback>Я</AvatarFallback>
            </Avatar>
          )}
          <button
            type="button"
            aria-label="Добавить сторис"
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-0 bottom-0 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <span className="text-xs text-muted-foreground">Вы</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {groups
        .filter((group) => group.userId !== currentUserId && group.stories.length > 0)
        .map((group) => {
          const groupIndex = groups.indexOf(group);
          return (
            <div key={group.userId} className="flex shrink-0 flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => setViewerGroupIndex(groupIndex)}
                className={cn(
                  "flex size-16 items-center justify-center rounded-full p-0.5",
                  isGroupUnviewed(groupIndex)
                    ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
                    : "bg-muted",
                )}
              >
                <Avatar className="size-full border-2 border-background">
                  <AvatarImage src={resolveImageUrl(group.userImage)} alt={group.userName} />
                  <AvatarFallback>{group.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
              </button>
              <span className="max-w-16 truncate text-xs">{group.userName}</span>
            </div>
          );
        })}

      {viewerGroupIndex !== null && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={viewerGroupIndex}
          onClose={() => setViewerGroupIndex(null)}
          onStoryViewed={markViewed}
        />
      )}

      <CreateStoryDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} file={pickedFile} />
    </div>
  );
}
