import axios, { type AxiosError, type AxiosResponse } from "axios";
import { toast } from "sonner";

import { useAuthStore } from "@/store/auth";
import { ApiError, type ApiEnvelope } from "./types";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://instagram-api.softclub.tj",
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
    // Не все эндпоинты оборачивают ответ в конверт {data, errors, statusCode} —
    // например /Post/get-my-posts отдаёт голый JSON-массив. Пропускаем такие ответы как есть.
    if (!isEnvelope(response.data)) {
      return response;
    }

    const envelope = response.data;

    if (envelope.errors && envelope.errors.length > 0) {
      // Часть write-эндпоинтов (update-user-profile, delete-user-image-profile,
      // add/delete-following-relation-ship и т.п.) на успехе кладёт в errors[] строки вида
      // "success", "success followed", "success un followed" вместо того, чтобы оставить
      // массив пустым — это не ошибка, отфильтровываем такой шум по префиксу "success".
      const meaningfulErrors = envelope.errors.filter(
        (message) => !message.trim().toLowerCase().startsWith("success"),
      );

      if (meaningfulErrors.length > 0) {
        const message = extractMessage(meaningfulErrors, "Произошла ошибка");
        toast.error(message);
        return Promise.reject(new ApiError(message, envelope.statusCode, meaningfulErrors));
      }
    }

    // Пагинированные списки помимо data содержат pageNumber/pageSize/totalPage/totalRecord
    // на верхнем уровне конверта — собираем их в единый объект для infinite scroll.
    if (envelope.pageNumber !== undefined) {
      response.data = {
        items: envelope.data,
        pageNumber: envelope.pageNumber,
        pageSize: envelope.pageSize,
        totalPage: envelope.totalPage,
        totalRecord: envelope.totalRecord,
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

    toast.error(message);
    return Promise.reject(new ApiError(message, error.response?.status, envelope?.errors ?? []));
  },
);
