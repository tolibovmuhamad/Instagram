import { z } from "zod";

export const loginSchema = z.object({
  userName: z.string().min(1, "Введите имя пользователя"),
  password: z.string().min(1, "Введите пароль"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    userName: z.string().min(1, "Введите имя пользователя"),
    fullName: z.string().min(1, "Введите имя и фамилию"),
    email: z.email("Некорректный email"),
    password: z.string().min(6, "Минимум 6 символов"),
    confirmPassword: z.string().min(1, "Повторите пароль"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Некорректный email"),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Ссылка недействительна"),
    email: z.email("Некорректный email"),
    password: z.string().min(6, "Минимум 6 символов"),
    confirmPassword: z.string().min(1, "Повторите пароль"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Введите текущий пароль"),
    password: z.string().min(6, "Минимум 6 символов"),
    confirmPassword: z.string().min(1, "Повторите пароль"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
