"use client";

import { PostGrid } from "@/components/post/PostGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserPostsInfinite } from "@/features/posts/hooks";
import { useFavoritePostsInfinite } from "@/features/users/hooks";

interface ProfileTabsProps {
  userId: string;
  isOwnProfile: boolean;
}

export function ProfileTabs({ userId, isOwnProfile }: ProfileTabsProps) {
  const postsQuery = useUserPostsInfinite(userId);
  const favoritesQuery = useFavoritePostsInfinite(isOwnProfile);

  const posts = postsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const favorites = favoritesQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className={isOwnProfile ? "grid w-full grid-cols-2" : "grid w-full grid-cols-1"}>
        <TabsTrigger value="posts">Публикации</TabsTrigger>
        {isOwnProfile && <TabsTrigger value="saved">Сохранённое</TabsTrigger>}
      </TabsList>

      <TabsContent value="posts" className="pt-4">
        <PostGrid
          posts={posts}
          isLoading={postsQuery.isPending}
          isError={postsQuery.isError}
          hasNextPage={postsQuery.hasNextPage}
          isFetchingNextPage={postsQuery.isFetchingNextPage}
          onLoadMore={() => postsQuery.fetchNextPage()}
          emptyMessage="Пока нет публикаций"
        />
      </TabsContent>

      {isOwnProfile && (
        <TabsContent value="saved" className="pt-4">
          <PostGrid
            posts={favorites}
            isLoading={favoritesQuery.isPending}
            isError={favoritesQuery.isError}
            hasNextPage={favoritesQuery.hasNextPage}
            isFetchingNextPage={favoritesQuery.isFetchingNextPage}
            onLoadMore={() => favoritesQuery.fetchNextPage()}
            emptyMessage="Нет сохранённых публикаций"
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
