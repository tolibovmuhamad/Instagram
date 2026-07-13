"use client";

import { PostFeedList } from "@/components/post/PostFeedList";
import { StoryAvatarRail } from "@/components/story/StoryAvatarRail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeedInfinite, useFollowingFeedInfinite } from "@/features/posts/hooks";

export default function FeedPage() {
  const feedQuery = useFeedInfinite();
  const followingQuery = useFollowingFeedInfinite();

  const feedPosts = feedQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const followingPosts = followingQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <main className="mx-auto w-full max-w-lg py-4">
      <StoryAvatarRail />
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="following">Подписки</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <PostFeedList
            posts={feedPosts}
            isLoading={feedQuery.isPending}
            isError={feedQuery.isError}
            hasNextPage={feedQuery.hasNextPage}
            isFetchingNextPage={feedQuery.isFetchingNextPage}
            onLoadMore={() => feedQuery.fetchNextPage()}
            emptyMessage="Пока нет публикаций"
          />
        </TabsContent>

        <TabsContent value="following">
          <PostFeedList
            posts={followingPosts}
            isLoading={followingQuery.isPending}
            isError={followingQuery.isError}
            hasNextPage={followingQuery.hasNextPage}
            isFetchingNextPage={followingQuery.isFetchingNextPage}
            onLoadMore={() => followingQuery.fetchNextPage()}
            emptyMessage="Подпишитесь на кого-нибудь, чтобы видеть публикации здесь"
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
