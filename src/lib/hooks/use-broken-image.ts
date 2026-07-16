"use client";

import { useCallback, useState } from "react";

/**
 * Отмечает картинки, которые не загрузились, чтобы показать заглушку вместо
 * «битого» изображения. Часть файлов на сервере пропадает: на Render диск эфемерный —
 * при рестарте загруженное исчезает, а записи в БД остаются, и /images/{file} отвечает
 * ошибкой (проверено: у постов, загруженных час назад, картинки уже недоступны).
 *
 * Состояние хранится по имени файла, а не по индексу: в карусели поста слайды
 * переключаются, и заглушка должна следовать за конкретным файлом.
 */
export function useBrokenImage() {
  const [brokenFiles, setBrokenFiles] = useState<Record<string, boolean>>({});

  const isBroken = useCallback(
    (filename: string | undefined) => !!filename && !!brokenFiles[filename],
    [brokenFiles],
  );

  /** Пропсы для <Image>: onError срабатывает, когда файл недоступен. */
  const imageProps = useCallback(
    (filename: string | undefined) => ({
      onError: () => {
        if (filename) setBrokenFiles((prev) => ({ ...prev, [filename]: true }));
      },
    }),
    [],
  );

  return { isBroken, imageProps };
}
