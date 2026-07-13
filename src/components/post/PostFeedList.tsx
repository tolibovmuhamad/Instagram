"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { Skeleton } from "@/components/ui/skeleton";
import type { Post } from "@/features/posts/types";

import { PostCard } from "./PostCard";

interface PostFeedListProps {
  posts: Post[];
  isLoading: boolean;
  isError?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  emptyMessage: string;
}

export function PostFeedList({
  posts,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  emptyMessage,
}: PostFeedListProps) {
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  if (isLoading) {
    return (
      <div className="space-y-6 py-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="aspect-square w-full rounded-[4px]" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-16 text-center text-sm text-destructive">
        Не удалось загрузить публикации
      </p>
    );
  }

  if (posts.length === 0) {
    return <p className="py-16 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.postId} post={post} />
      ))}
      {hasNextPage && <div ref={ref} className="h-px" />}
    </div>
  );
}
