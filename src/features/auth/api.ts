import { apiClient } from "@/lib/api/client";

import type {
  ChangePasswordFormValues,
  ForgotPasswordFormValues,
  LoginFormValues,
  RegisterFormValues,
  ResetPasswordFormValues,
} from "./schemas";

export async function loginRequest(values: LoginFormValues) {
  const { data } = await apiClient.post<string>("/Account/login", values);
  return data;
}

export async function registerRequest(values: RegisterFormValues) {
  const { data } = await apiClient.post<string>("/Account/register", values);
  return data;
}

export async function forgotPasswordRequest(values: ForgotPasswordFormValues) {
  const { data } = await apiClient.delete<string>("/Account/ForgotPassword", {
    params: { Email: values.email },
  });
  return data;
}

export async function resetPasswordRequest(values: ResetPasswordFormValues) {
  const { data } = await apiClient.delete<string>("/Account/ResetPassword", {
    params: {
      Token: values.token,
      Email: values.email,
      Password: values.password,
      ConfirmPassword: values.confirmPassword,
    },
  });
  return data;
}

export async function changePasswordRequest(values: ChangePasswordFormValues) {
  const { data } = await apiClient.put<string>("/Account/ChangePassword", null, {
    params: {
      OldPassword: values.oldPassword,
      Password: values.password,
      ConfirmPassword: values.confirmPassword,
    },
  });
  return data;
}
