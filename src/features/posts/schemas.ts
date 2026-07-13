import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().max(200, "Слишком длинный заголовок"),
  content: z.string().max(2200, "Слишком длинное описание"),
});
export type CreatePostFormValues = z.infer<typeof createPostSchema>;

export const addCommentSchema = z.object({
  comment: z.string().min(1, "Введите комментарий").max(500, "Слишком длинный комментарий"),
});
export type AddCommentFormValues = z.infer<typeof addCommentSchema>;
