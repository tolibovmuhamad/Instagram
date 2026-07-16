import axios from "axios";

import { API_URL, apiClient, unwrapEnvelope } from "@/lib/api/client";

import type {
  ChangePasswordFormValues,
  ForgotPasswordFormValues,
  LoginFormValues,
  RegisterFormValues,
  ResetPasswordFormValues,
} from "./schemas";
import type { AuthTokens } from "./types";

export async function loginRequest(values: LoginFormValues) {
  const { data } = await apiClient.post<AuthTokens>("/Account/login", values);
  return data;
}

export async function registerRequest(values: RegisterFormValues) {
  const { data } = await apiClient.post<AuthTokens>("/Account/register", values);
  return data;
}

/**
 * Обновление пары токенов. Идёт мимо apiClient намеренно: его интерцептор сам ловит 401
 * и дёргает обновление, так что вызов отсюда зациклился бы.
 *
 * ВАЖНО: бэкенд ротирует refreshToken и детектирует повторное использование —
 * второй запрос со старым токеном отвечает 401 «Обнаружено повторное использование
 * токена. Все сессии завершены.» и действительно разлогинивает пользователя везде.
 * Поэтому вызывать это можно только из refreshAccessToken(), где стоит single-flight.
 */
export async function refreshTokensRequest(refreshToken: string) {
  const response = await axios.post(`${API_URL}/Account/refresh-token`, { refreshToken });
  return unwrapEnvelope<AuthTokens>(response.data);
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
