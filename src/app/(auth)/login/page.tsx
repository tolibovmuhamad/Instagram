"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AuthLoadingScreen } from "@/components/AuthLoadingScreen";
import { BrandIcon } from "@/components/BrandIcon";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/features/auth/hooks";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { useAuthStore } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const login = useLogin();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values, {
      onSuccess: (tokens) => {
        setAuth(tokens);
        toast.success("Вы вошли в аккаунт");
        setIsRedirecting(true);
        router.push("/");
      },
    });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.35fr_1fr]">
      <AuthLoadingScreen show={login.isPending || isRedirecting} />

      <section className="relative hidden items-center justify-center overflow-hidden px-16 lg:flex">
        <BrandIcon className="absolute top-12 left-16 h-16 w-16 rounded-2xl" />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/4 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 opacity-20 blur-3xl"
        />
        <h2 className="relative max-w-xl text-center text-4xl leading-snug font-semibold text-balance">
          Посмотрите, какими моментами из жизни поделились ваши{" "}
          <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent">
            близкие друзья
          </span>
          .
        </h2>
      </section>

      <section className="flex items-center justify-center px-6 py-12 lg:border-l lg:bg-card">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex justify-center lg:hidden">
            <BrandIcon className="h-16 w-16 rounded-2xl" />
          </div>

          <h1 className="text-lg font-semibold">Вход в аккаунт</h1>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field data-invalid={!!errors.userName}>
                <FieldLabel htmlFor="userName" className="sr-only">
                  Имя пользователя
                </FieldLabel>
                <Input
                  id="userName"
                  autoComplete="username"
                  placeholder="Имя пользователя"
                  className="h-14 rounded-2xl px-4 text-base"
                  {...register("userName")}
                />
                <FieldError errors={[errors.userName]} />
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password" className="sr-only">
                  Пароль
                </FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Пароль"
                  className="h-14 rounded-2xl px-4 text-base"
                  {...register("password")}
                />
                <FieldError errors={[errors.password]} />
              </Field>

              <Button
                type="submit"
                disabled={login.isPending}
                className="h-12 w-full rounded-2xl bg-[#0095F6] text-base font-semibold text-white hover:bg-[#1877F2]"
              >
                {login.isPending ? "Входим…" : "Войти"}
              </Button>
            </FieldGroup>
          </form>

          <Link
            href="/forgot-password"
            className="block text-center text-sm font-semibold hover:underline"
          >
            Забыли пароль?
          </Link>

          <Link
            href="/register"
            className="flex h-12 items-center justify-center rounded-2xl border border-[#0095F6]/50 text-sm font-semibold text-[#0095F6] transition-colors hover:bg-[#0095F6]/10"
          >
            Создать новый аккаунт
          </Link>
        </div>
      </section>
    </div>
  );
}
