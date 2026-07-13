"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { BrandIcon } from "@/components/BrandIcon";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@/features/auth/hooks";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/features/auth/schemas";

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = (values: ForgotPasswordFormValues) => {
    forgotPassword.mutate(values, {
      onSuccess: () => {
        toast.success("Проверьте почту — мы отправили ссылку для сброса пароля");
      },
    });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div className="flex justify-center">
        <BrandIcon className="h-14 w-14 rounded-2xl" />
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Забыли пароль?</h1>
        <p className="text-sm text-muted-foreground">
          Укажите email — пришлём ссылку для восстановления доступа.
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

          <Button
            type="submit"
            disabled={forgotPassword.isPending}
            className="h-12 w-full rounded-2xl bg-[#0095F6] text-base font-semibold text-white hover:bg-[#1877F2]"
          >
            {forgotPassword.isPending ? "Отправляем…" : "Отправить ссылку"}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Уже есть ссылка для сброса?{" "}
        <Link href="/reset-password" className="hover:underline">
          Сбросить пароль
        </Link>
      </p>
      <p className="text-center text-sm text-muted-foreground">
        Вспомнили пароль?{" "}
        <Link href="/login" className="hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
