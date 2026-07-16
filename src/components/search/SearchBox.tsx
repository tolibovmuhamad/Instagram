"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useAddSearchHistory,
  useAddUserSearchHistory,
  useDeleteSearchHistories,
  useDeleteSearchHistory,
  useDeleteUserSearchHistories,
  useDeleteUserSearchHistory,
  useSearchHistories,
  useSearchUsers,
  useUserSearchHistories,
} from "@/features/users/hooks";
import { resolveAvatarUrl } from "@/lib/utils/image";

const DEBOUNCE_MS = 400;

interface SearchBoxProps {
  /** Панель открывается по клику — фокус сразу в поле, как в Instagram. */
  autoFocus?: boolean;
  /** Уход по ссылке из результатов: панели нужно закрыться, странице — ничего. */
  onNavigate?: () => void;
  /**
   * Что показывать вместо пустоты, пока запрос не введён. Здесь расходятся два
   * места использования: в выдвижной панели под историей нет ничего, а на мобильной
   * странице поиска — сетка «Популярное» (так устроен поиск в мобильном Instagram).
   */
  idleContent?: ReactNode;
  /**
   * Ширина колонки с полем, результатами и историей. `idleContent` намеренно её не
   * получает: на странице поиска колонка узкая (max-w-md), а сетка под ней — во всю
   * ширину. В панели колонка занимает всю ширину, и класс не нужен.
   */
  columnClassName?: string;
}

export function SearchBox({
  autoFocus,
  onNavigate,
  idleContent,
  columnClassName,
}: SearchBoxProps) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(inputValue.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const searchQuery = useSearchUsers(debouncedQuery);
  const searchHistories = useSearchHistories();
  const userSearchHistories = useUserSearchHistories();

  const addSearchHistory = useAddSearchHistory();
  const deleteSearchHistoryItem = useDeleteSearchHistory();
  const deleteAllSearchHistory = useDeleteSearchHistories();
  const addUserSearchHistory = useAddUserSearchHistory();
  const deleteUserSearchHistoryItem = useDeleteUserSearchHistory();
  const deleteAllUserSearchHistory = useDeleteUserSearchHistories();

  const isSearching = debouncedQuery.length > 0;
  const results = searchQuery.data?.items ?? [];

  const handleSubmitText = () => {
    if (inputValue.trim()) addSearchHistory.mutate(inputValue.trim());
  };

  return (
    <div className="space-y-6">
      <div className={cn("relative", columnClassName)}>
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus={autoFocus}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSubmitText();
          }}
          placeholder="Поиск"
          aria-label="Поиск пользователей"
          className="pl-9"
        />
      </div>

      {isSearching ? (
        <div className={cn("space-y-1", columnClassName)}>
          {searchQuery.isPending &&
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-2">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}

          {searchQuery.isError && (
            <p className="py-8 text-center text-sm text-destructive">Не удалось выполнить поиск</p>
          )}

          {!searchQuery.isPending && !searchQuery.isError && results.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Ничего не найдено</p>
          )}

          {results.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              onClick={() => {
                addUserSearchHistory.mutate(user.id);
                onNavigate?.();
              }}
              className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
            >
              <Avatar className="size-10">
                <AvatarImage src={resolveAvatarUrl(user.avatar)} alt={user.userName} />
                <AvatarFallback>{user.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user.userName}</p>
                <p className="text-xs text-muted-foreground">{user.fullName}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <div className={cn("space-y-6", columnClassName)}>
            {(userSearchHistories.data?.length ?? 0) > 0 && (
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-medium">Недавнее</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAllUserSearchHistory.mutate()}
                  >
                    Очистить всё
                  </Button>
                </div>
                <div className="space-y-1">
                  {userSearchHistories.data?.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
                    >
                      <Link
                        href={`/profile/${entry.searchedUserId}`}
                        onClick={() => onNavigate?.()}
                        className="flex flex-1 items-center gap-3"
                      >
                        <Avatar className="size-10">
                          <AvatarImage
                            src={resolveAvatarUrl(entry.searchedUserAvatar)}
                            alt={entry.searchedUserName}
                          />
                          <AvatarFallback>
                            {entry.searchedUserName.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium">{entry.searchedUserName}</p>
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Удалить из истории"
                        onClick={() => deleteUserSearchHistoryItem.mutate(entry.id)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(searchHistories.data?.length ?? 0) > 0 && (
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-medium">Недавние запросы</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAllSearchHistory.mutate()}
                  >
                    Очистить всё
                  </Button>
                </div>
                <div className="space-y-1">
                  {searchHistories.data?.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-md p-2 hover:bg-muted"
                    >
                      <button
                        type="button"
                        onClick={() => setInputValue(entry.text)}
                        className="flex-1 text-left text-sm"
                      >
                        {entry.text}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Удалить из истории"
                        onClick={() => deleteSearchHistoryItem.mutate(entry.id)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {idleContent}
        </div>
      )}
    </div>
  );
}
