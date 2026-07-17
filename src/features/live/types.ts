// Эфиры (/Live) — модуль на LiveKit: бэкенд держит состояние эфира и раздаёт токены
// доступа к комнате, само видео идёт через LiveKit Cloud мимо нашего API.
//
// В Swagger у /Live нет НИ ОДНОЙ схемы ответа (только пути), поэтому всё ниже выяснено
// запросами 17.07.2026 — правки сверять с реальным API, а не со Swagger.

/** Кому виден эфир. ВНИМАНИЕ на асимметрию: на вход идёт число, с сервера приходит строка. */
export type LiveAudience = 0 | 1;
export type LiveAudienceName = "All" | "CloseFriends";

export type LiveStatus = "Live" | "Ended";

/** Компактный пользователь — одинаковый у хоста, зрителя, гостя и автора комментария. */
export interface LiveUser {
  userId: string;
  userName: string;
  fullName: string | null;
  avatar: string | null;
  isVerified: boolean;
}

/**
 * Доступ к комнате LiveKit. Возвращают и start (хосту), и join (зрителю) — форма одна,
 * различаются только права внутри JWT (canPublish у хоста true, у зрителя false).
 */
export interface LiveAccess {
  streamId: number;
  roomName: string;
  /** JWT для LiveKit, НЕ для нашего API. Живёт ~6 часов. */
  token: string;
  /** wss-адрес LiveKit Cloud; приходит с сервера, хардкодить нельзя. */
  serverUrl: string;
}

export interface LiveStream {
  streamId: number;
  roomName: string;
  title: string | null;
  status: LiveStatus;
  audience: LiveAudienceName;
  host: LiveUser;
  startedAt: string;
  endedAt: string | null;
  currentViewers: number;
  viewersPeak: number;
  viewersTotal: number;
  commentsCount: number;
  likesCount: number;
  guestsCount: number;
  savedToStory: boolean;
  /** Записи эфиров сейчас не ведутся — всегда null, из-за чего не работает save-to-story. */
  recordingUrl: string | null;
  /** В get-stream-by-id — массив; в списке get-active приходит null. */
  guests: LiveUser[] | null;
}

export interface LiveComment {
  id: number;
  user: LiveUser;
  text: string;
  createdAt: string;
  isPinned: boolean;
}

export interface LiveViewer {
  user: LiveUser;
  joinedAt: string;
}

export type GuestRequestStatus = "Pending" | "Approved" | "Declined";

/** Заявка в гости. Ключ называется requestId, а НЕ id — approve/decline ждут именно его. */
export interface LiveGuestRequest {
  requestId: number;
  user: LiveUser;
  requestedAt: string;
  status: GuestRequestStatus;
}

export interface LiveStats {
  streamId: number;
  status: LiveStatus;
  currentViewers: number;
  viewersPeak: number;
  uniqueViewers: number;
  commentsCount: number;
  likesCount: number;
  activeGuests: number;
  guestRequestsCount: number;
  durationSeconds: number;
  averageWatchSeconds: number;
  totalWatchSeconds: number;
  topCommenters: LiveUser[];
}
