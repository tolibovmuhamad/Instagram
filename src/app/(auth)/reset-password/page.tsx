"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { BrandIcon } from "@/components/BrandIcon";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useResetPassword } from "@/features/auth/hooks";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/features/auth/schemas";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetPassword = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: searchParams.get("token") ?? "",
      email: searchParams.get("email") ?? "",
    },
  });

  const onSubmit = (values: ResetPasswordFormValues) => {
    resetPassword.mutate(values, {
      onSuccess: () => {
        toast.success("Пароль обновлён, теперь войдите");
        router.push("/login");
      },
    });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div className="flex justify-center">
        <BrandIcon className="h-14 w-14 rounded-2xl" />
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Новый пароль</h1>
        <p className="text-sm text-muted-foreground">
          Введите email и код из письма вместе с новым паролем.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email" className="sr-only">
              Email
            </FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Электронный адрес"
              className="h-14 rounded-2xl px-4 text-base"
              {...register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>

          <Field data-invalid={!!errors.token}>
            <FieldLabel htmlFor="token" className="sr-only">
              Код из письма
            </FieldLabel>
            <Input
              id="token"
              placeholder="Код из письма"
              className="h-14 rounded-2xl px-4 text-base"
              {...register("token")}
            />
            <FieldError errors={[errors.token]} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password" className="sr-only">
              Новый пароль
            </FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Новый пароль"
              className="h-14 rounded-2xl px-4 text-base"
              {...register("password")}
            />
            <FieldError errors={[errors.password]} />
          </Field>

          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor="confirmPassword" className="sr-only">
              Повторите пароль
            </FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Повторите пароль"
              className="h-14 rounded-2xl px-4 text-base"
              {...register("confirmPassword")}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>

          <Button
            type="submit"
            disabled={resetPassword.isPending}
            className="h-12 w-full rounded-2xl bg-[#0095F6] text-base font-semibold text-white hover:bg-[#1877F2]"
          >
            {resetPassword.isPending ? "Сохраняем…" : "Сохранить пароль"}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="hover:underline">
          Вернуться ко входу
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
