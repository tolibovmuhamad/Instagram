import axios, { type AxiosError, type AxiosResponse } from "axios";
import { toast } from "sonner";

import { useAuthStore } from "@/store/auth";
import { ApiError, type ApiEnvelope } from "./types";

declare module "axios" {
  // Вызывающий код может сам обработать ошибку и не хочет тоста поверх неё.
  export interface AxiosRequestConfig {
    skipErrorToast?: boolean;
  }
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://instagram-backend-ea2y.onrender.com",
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function extractMessage(errors: string[] | null | undefined, fallback: string) {
  return errors && errors.length > 0 ? errors.join(", ") : fallback;
}

function isEnvelope(body: unknown): body is ApiEnvelope<unknown> {
  return (
    !!body && typeof body === "object" && !Array.isArray(body) && "statusCode" in body
  );
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (!isEnvelope(response.data)) {
      return response;
    }

    const envelope = response.data;

    if (envelope.errors && envelope.errors.length > 0) {
      const message = extractMessage(envelope.errors, "Произошла ошибка");
      toast.error(message);
      return Promise.reject(new ApiError(message, envelope.statusCode, envelope.errors));
    }

    // Пагинированные списки помимо data содержат pageNumber/pageSize/totalPages/totalRecords
    // на верхнем уровне конверта — собираем их в единый объект для infinite scroll.
    if (envelope.pageNumber !== undefined) {
      response.data = {
        items: envelope.data,
        pageNumber: envelope.pageNumber,
        pageSize: envelope.pageSize,
        totalPages: envelope.totalPages,
        totalRecords: envelope.totalRecords,
      } as never;
    } else {
      response.data = envelope.data as never;
    }

    return response;
  },
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const envelope = error.response?.data;
    const message = extractMessage(envelope?.errors, error.message || "Произошла ошибка");

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }

    if (!error.config?.skipErrorToast) {
      toast.error(message);
    }

    return Promise.reject(new ApiError(message, error.response?.status, envelope?.errors ?? []));
  },
);
