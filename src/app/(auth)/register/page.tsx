"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { BrandIcon } from "@/components/BrandIcon";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/features/auth/hooks";
import { registerSchema, type RegisterFormValues } from "@/features/auth/schemas";

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Аккаунт создан, теперь войдите");
        router.push("/login");
      },
    });
  };

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-10">
      <Link
        href="/login"
        aria-label="Назад ко входу"
        className="inline-flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-6" />
      </Link>

      <BrandIcon className="mt-4 h-10 w-10 rounded-xl" />

      <h1 className="mt-4 text-3xl leading-tight font-bold text-balance">Создайте аккаунт</h1>
      <p className="mt-2 text-muted-foreground">
        Заполните данные, чтобы делиться моментами из жизни с близкими друзьями.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8">
        <FieldGroup>
          <Field data-invalid={!!errors.userName}>
            <FieldLabel htmlFor="userName" className="text-[15px] font-semibold">
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

          <Field data-invalid={!!errors.fullName}>
            <FieldLabel htmlFor="fullName" className="text-[15px] font-semibold">
              Имя и фамилия
            </FieldLabel>
            <Input
              id="fullName"
              autoComplete="name"
              placeholder="Имя и фамилия"
              className="h-14 rounded-2xl px-4 text-base"
              {...register("fullName")}
            />
            <FieldError errors={[errors.fullName]} />
          </Field>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email" className="text-[15px] font-semibold">
              Электронный адрес
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

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password" className="text-[15px] font-semibold">
              Пароль
            </FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Пароль"
              className="h-14 rounded-2xl px-4 text-base"
              {...register("password")}
            />
            <FieldError errors={[errors.password]} />
          </Field>

          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor="confirmPassword" className="text-[15px] font-semibold">
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
            disabled={registerMutation.isPending}
            className="h-12 w-full rounded-2xl bg-[#0095F6] text-base font-semibold text-white hover:bg-[#1877F2]"
          >
            {registerMutation.isPending ? "Создаём аккаунт…" : "Зарегистрироваться"}
          </Button>
        </FieldGroup>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-semibold text-foreground hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
