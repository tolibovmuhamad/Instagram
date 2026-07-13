"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChangePassword } from "@/features/auth/hooks";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/features/auth/schemas";

export function ChangePasswordPanel() {
  const changePassword = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = (values: ChangePasswordFormValues) => {
    changePassword.mutate(values, {
      onSuccess: () => {
        toast.success("Пароль изменён");
        reset();
      },
    });
  };

  return (
    <div className="max-w-md">
      <h3 className="mb-1 text-lg font-semibold">Смена пароля</h3>
      <p className="mb-6 text-sm text-muted-foreground">
        Обновите пароль для входа в аккаунт.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.oldPassword}>
            <FieldLabel htmlFor="oldPassword">Текущий пароль</FieldLabel>
            <Input
              id="oldPassword"
              type="password"
              autoComplete="current-password"
              {...register("oldPassword")}
            />
            <FieldError errors={[errors.oldPassword]} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Новый пароль</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            <FieldError errors={[errors.password]} />
          </Field>

          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor="confirmPassword">Повторите новый пароль</FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>

          <Button type="submit" disabled={changePassword.isPending} className="w-fit">
            {changePassword.isPending ? "Сохранение…" : "Сменить пароль"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
