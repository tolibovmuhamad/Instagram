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

/**
 * Отзыв конкретной сессии на сервере при выходе из аккаунта.
 *
 * Идёт мимо apiClient и с явным заголовком: в мультиаккаунте выйти можно из ФОНОВОГО
 * аккаунта, чей токен не активен, — интерцептор подставил бы токен активного и отозвал не ту
 * сессию. Best-effort: результат не критичен (локально аккаунт всё равно убираем), ошибки
 * глушим у вызывающего.
 */
export async function logoutRequest(accessToken: string) {
  await axios.post(`${API_URL}/Account/logout`, null, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
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
