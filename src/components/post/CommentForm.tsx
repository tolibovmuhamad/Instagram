"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddComment } from "@/features/posts/hooks";
import { addCommentSchema, type AddCommentFormValues } from "@/features/posts/schemas";

export function CommentForm({ postId }: { postId: number }) {
  const addComment = useAddComment(postId);
  const { register, handleSubmit, reset } = useForm<AddCommentFormValues>({
    resolver: zodResolver(addCommentSchema),
  });

  const onSubmit = (values: AddCommentFormValues) => {
    addComment.mutate({ comment: values.comment }, { onSuccess: () => reset() });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex items-center gap-2 border-t pt-3"
      noValidate
    >
      <Input
        placeholder="Добавьте комментарий…"
        aria-label="Добавить комментарий"
        {...register("comment")}
      />
      <Button type="submit" variant="ghost" disabled={addComment.isPending}>
        Опубликовать
      </Button>
    </form>
  );
}
