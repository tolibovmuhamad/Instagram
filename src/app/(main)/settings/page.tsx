"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useChangePassword } from "@/features/auth/hooks";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/features/auth/schemas";
import { useAuthStore } from "@/store/auth";

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
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

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <main className="mx-auto w-full max-w-md space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Настройки</h1>
        {user && <p className="text-sm text-muted-foreground">{user.userName}</p>}
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Смена пароля</h2>
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

            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? "Сохраняем…" : "Сохранить пароль"}
            </Button>
          </FieldGroup>
        </form>
      </section>

      <Separator />

      <section className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Тема</h2>
        <ThemeToggle />
      </section>

      <Separator />

      <section>
        <Button type="button" variant="outline" onClick={handleLogout}>
          Выйти из аккаунта
        </Button>
      </section>
    </main>
  );
}
