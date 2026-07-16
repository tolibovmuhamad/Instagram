import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DEFAULT_AVATAR_URL } from "@/lib/utils/image";

const BROKEN_SRC = "https://example.com/avatar-401.png";
const WORKING_SRC = "https://example.com/avatar-ok.png";

// Base UI определяет доступность аватара предзагрузкой через `new Image()`, а не событиями
// на <img>. jsdom картинки не грузит и всегда молчит, поэтому подменяем Image на фейк,
// который отвечает по заранее заданному списку рабочих ссылок.
function stubImageLoader(workingUrls: string[]) {
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    #src = "";

    set src(value: string) {
      this.#src = value;
      queueMicrotask(() => {
        if (workingUrls.includes(value)) this.onload?.();
        else this.onerror?.();
      });
    }

    get src() {
      return this.#src;
    }
  }

  vi.stubGlobal("Image", FakeImage);
}

// vitest.setup.ts не включает globals, поэтому автоочистки DOM между тестами нет —
// без неё аватар из предыдущего теста остаётся в документе и ломает поиск по alt.
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AvatarImage", () => {
  it("деградирует к силуэту, а не к инициалу, когда файл аватара не отдаётся", async () => {
    stubImageLoader([DEFAULT_AVATAR_URL]);

    render(
      <Avatar>
        <AvatarImage src={BROKEN_SRC} alt="aaa" />
        <AvatarFallback>A</AvatarFallback>
      </Avatar>,
    );

    await waitFor(() => {
      expect(screen.getByAltText("aaa")).toHaveAttribute("src", DEFAULT_AVATAR_URL);
    });
  });

  it("оставляет рабочий аватар как есть", async () => {
    stubImageLoader([WORKING_SRC, DEFAULT_AVATAR_URL]);

    render(
      <Avatar>
        <AvatarImage src={WORKING_SRC} alt="aaa" />
        <AvatarFallback>A</AvatarFallback>
      </Avatar>,
    );

    await waitFor(() => {
      expect(screen.getByAltText("aaa")).toHaveAttribute("src", WORKING_SRC);
    });
  });
});
