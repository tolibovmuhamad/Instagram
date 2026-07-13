"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send, Smile, X } from "lucide-react";
import { toast } from "sonner";

import { CommentList } from "@/components/post/CommentList";
import { PostMedia } from "@/components/post/PostMedia";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAddComment,
  useDeletePost,
  useLikePost,
  usePost,
  useToggleFavorite,
  useViewPost,
} from "@/features/posts/hooks";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

const COMMENT_EMOJIS = ["😀", "😂", "😍", "🥰", "🔥", "❤️", "👏", "🙏", "😎", "💯", "🎉", "😭"];

export function PostDetailView({ postId }: { postId: number }) {
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const postQuery = usePost(postId);
  const viewPost = useViewPost();
  const deletePost = useDeletePost();
  const likePost = useLikePost();
  const toggleFavorite = useToggleFavorite();
  const addComment = useAddComment(postId);
  const { mutate: registerView } = viewPost;

  const inputRef = useRef<HTMLInputElement>(null);
  const [commentText, setCommentText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  useEffect(() => {
    registerView(postId);
  }, [postId, registerView]);

  const close = () => router.back();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const post = postQuery.data;

  const handleReply = (userName: string) => {
    if (userName) setCommentText((value) => `@${userName} ${value.replace(/^@\S+\s/, "")}`.trimStart());
    inputRef.current?.focus();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = commentText.trim();
    if (!value) return;
    addComment.mutate(value, { onSuccess: () => setCommentText("") });
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    toast.success("Ссылка скопирована");
  };

  const handleDelete = () => {
    if (!post) return;
    deletePost.mutate(post.postId, {
      onSuccess: () => {
        toast.success("Пост удалён");
        router.push("/");
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 md:p-6"
      onClick={close}
      role="presentation"
    >
      <button
        type="button"
        aria-label="Закрыть"
        onClick={close}
        className="absolute right-4 top-4 z-10 text-white/90 transition-colors hover:text-white"
      >
        <X className="size-6" />
      </button>

      {postQuery.isPending || !post ? (
        <div
          className="flex h-[70vh] w-full max-w-[900px] items-center justify-center bg-background md:rounded-xl"
          onClick={(event) => event.stopPropagation()}
        >
          {postQuery.isError ? (
            <p className="text-sm text-muted-foreground">Пост не найден</p>
          ) : (
            <p className="text-sm text-muted-foreground">Загрузка…</p>
          )}
        </div>
      ) : (
        <div
          className="flex h-full w-full flex-col overflow-hidden bg-background md:h-[min(90vh,820px)] md:w-auto md:max-w-[1100px] md:flex-row md:rounded-xl"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Медиа. */}
          <PostMedia
            images={post.images}
            alt={post.title ?? "Пост"}
            className="aspect-square w-full shrink-0 md:aspect-auto md:h-full md:w-[min(72vh,680px)]"
          />

          {/* Правая панель. */}
          <div className="flex min-h-0 w-full flex-col md:w-[400px] lg:w-[460px]">
            {/* Шапка. */}
            <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
              <Link href={`/profile/${post.userId}`} className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarImage src={resolveImageUrl(post.userImage)} alt={post.userName ?? ""} />
                  <AvatarFallback>{(post.userName ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold">{post.userName ?? "Пользователь"}</span>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<button type="button" aria-label="Меню поста" className="p-1" />}
                >
                  <MoreHorizontal className="size-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleShare}>Скопировать ссылку</DropdownMenuItem>
                  {currentUserId === post.userId && (
                    <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                      Удалить
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </header>

            {/* Подпись + комментарии. */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
              {post.content && (
                <div className="flex items-start gap-3">
                  <Avatar className="size-8 shrink-0">
                    <AvatarImage src={resolveImageUrl(post.userImage)} alt={post.userName ?? ""} />
                    <AvatarFallback>
                      {(post.userName ?? "?").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm leading-snug">
                    <Link href={`/profile/${post.userId}`} className="font-semibold">
                      {post.userName ?? "Пользователь"}
                    </Link>{" "}
                    <span className="break-words">{post.content}</span>
                  </p>
                </div>
              )}

              <CommentList postId={post.postId} comments={post.comments} onReply={handleReply} />
            </div>

            {/* Действия. */}
            <div className="border-t px-4 pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    aria-label={post.postLike ? "Убрать лайк" : "Поставить лайк"}
                    onClick={() => likePost.mutate(post.postId)}
                    className="transition-transform active:scale-90"
                  >
                    <Heart
                      className={cn("size-6", post.postLike && "fill-red-500 text-red-500")}
                    />
                  </button>
                  <button
                    type="button"
                    aria-label="Комментировать"
                    onClick={() => inputRef.current?.focus()}
                  >
                    <MessageCircle className="size-6 -scale-x-100" />
                  </button>
                  <button type="button" aria-label="Поделиться" onClick={handleShare}>
                    <Send className="size-6" />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label={post.postFavorite ? "Убрать из сохранённого" : "Сохранить"}
                  onClick={() => toggleFavorite.mutate(post.postId)}
                >
                  <Bookmark className={cn("size-6", post.postFavorite && "fill-current")} />
                </button>
              </div>

              {/* Лайки. */}
              {post.postLikeCount > 0 && (
                <p className="mt-2 text-sm">
                  {post.userLikes && post.userLikes.length > 0 ? (
                    <>
                      Нравится{" "}
                      <Link
                        href={`/profile/${post.userLikes[0].userId}`}
                        className="font-semibold"
                      >
                        {post.userLikes[0].userName}
                      </Link>
                      {post.postLikeCount > 1 && (
                        <>
                          {" "}и ещё <span className="font-semibold">{post.postLikeCount - 1}</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="font-semibold">
                      {post.postLikeCount} отметок «Нравится»
                    </span>
                  )}
                </p>
              )}

              <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                {format(new Date(post.datePublished), "d MMMM", { locale: ru })}
              </p>
            </div>

            {/* Поле ввода. */}
            <form
              onSubmit={handleSubmit}
              className="relative flex items-center gap-2 border-t px-4 py-2.5"
            >
              <button
                type="button"
                aria-label="Эмодзи"
                onClick={() => setShowEmoji((value) => !value)}
              >
                <Smile className="size-6" />
              </button>

              {showEmoji && (
                <div className="absolute bottom-full left-2 mb-1 grid grid-cols-6 gap-1 rounded-2xl border bg-background p-2 shadow-lg">
                  {COMMENT_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setCommentText((value) => value + emoji);
                        inputRef.current?.focus();
                      }}
                      className="grid size-8 place-items-center rounded-lg text-lg hover:bg-muted"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <input
                ref={inputRef}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Добавьте комментарий…"
                aria-label="Добавить комментарий"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />

              <button
                type="submit"
                disabled={!commentText.trim() || addComment.isPending}
                className={cn(
                  "text-sm font-semibold text-[#0095f6] transition-opacity",
                  !commentText.trim() ? "cursor-default opacity-40" : "hover:opacity-70",
                )}
              >
                Опубликовать
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
