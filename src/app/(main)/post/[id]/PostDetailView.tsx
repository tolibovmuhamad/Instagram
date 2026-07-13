"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { CommentForm } from "@/components/post/CommentForm";
import { CommentList } from "@/components/post/CommentList";
import { PostActionsBar } from "@/components/post/PostActionsBar";
import { PostMedia } from "@/components/post/PostMedia";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeletePost, usePost, useViewPost } from "@/features/posts/hooks";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

export function PostDetailView({ postId }: { postId: number }) {
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const postQuery = usePost(postId);
  const viewPost = useViewPost();
  const deletePost = useDeletePost();
  const { mutate: registerView } = viewPost;

  useEffect(() => {
    registerView(postId);
  }, [postId, registerView]);

  if (postQuery.isPending) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <Skeleton className="aspect-square w-full" />
      </div>
    );
  }

  const post = postQuery.data;
  if (postQuery.isError || !post) {
    return <p className="w-full p-8 text-center text-muted-foreground">Пост не найден</p>;
  }

  const isOwnPost = currentUserId === post.userId;

  const handleDelete = () => {
    deletePost.mutate(post.postId, {
      onSuccess: () => {
        toast.success("Пост удалён");
        router.push("/");
      },
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col md:flex-row md:border">
      <div className="md:w-1/2">
        <PostMedia images={post.images} alt={post.title ?? "Пост"} />
      </div>

      <div className="flex flex-col md:w-1/2">
        <header className="flex items-center justify-between gap-2 border-b p-3">
          <Link href={`/profile/${post.userId}`} className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarImage src={resolveImageUrl(post.userImage)} alt={post.userName ?? ""} />
              <AvatarFallback>{(post.userName ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{post.userName ?? "Пользователь"}</span>
          </Link>

          {isOwnPost && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Меню поста" />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-3">
          {post.content && (
            <p className="text-sm">
              <span className="font-medium">{post.userName}</span> {post.content}
            </p>
          )}
          <CommentList postId={post.postId} comments={post.comments} />
        </div>

        <footer className="border-t">
          <PostActionsBar post={post} />
          <p className="px-3 pt-2 text-xs text-muted-foreground">
            {post.postLikeCount} отметок «Нравится» · {post.postView} просмотров ·{" "}
            {formatDistanceToNow(new Date(post.datePublished), { addSuffix: true, locale: ru })}
          </p>
          <div className="px-3 pb-3">
            <CommentForm postId={post.postId} />
          </div>
        </footer>
      </div>
    </div>
  );
}
