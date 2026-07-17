import { describe, expect, it } from "vitest";

import {
  getActiveStories,
  getStoryRing,
  isStoryActive,
  STORY_LIFETIME_MS,
  type Story,
  type StoryAudience,
} from "../types";

const NOW = new Date("2026-07-17T12:00:00Z").getTime();

const hoursAgo = (hours: number) => new Date(NOW - hours * 60 * 60 * 1000).toISOString();

// В тестах важны только id/createAt/audience — остальное у Story обязательное, но к делу
// не относится.
const makeStory = (id: number, createAt: string, audience: StoryAudience = 0): Story =>
  ({ id, createAt, audience }) as Story;

const nothingViewed = () => false;
const allViewed = () => true;

describe("isStoryActive / getActiveStories", () => {
  it("история моложе 24 часов — живая", () => {
    expect(isStoryActive(makeStory(1, hoursAgo(23)), NOW)).toBe(true);
  });

  // Бэкенд истории не удаляет: get-my-stories отдаёт весь архив, поэтому границу
  // держит клиент. Ровно на 24 часах история уже мертва.
  it("история старше 24 часов — мертва", () => {
    expect(isStoryActive(makeStory(1, hoursAgo(25)), NOW)).toBe(false);
    expect(isStoryActive(makeStory(1, new Date(NOW - STORY_LIFETIME_MS).toISOString()), NOW)).toBe(
      false,
    );
  });

  it("отбирает из архива только живые, сохраняя порядок", () => {
    const active = getActiveStories(
      [
        makeStory(1, hoursAgo(48)),
        makeStory(2, hoursAgo(5)),
        makeStory(3, hoursAgo(30)),
        makeStory(4, hoursAgo(1)),
      ],
      NOW,
    );

    expect(active.map((story) => story.id)).toEqual([2, 4]);
  });
});

describe("getStoryRing", () => {
  it("без живых историй кольца нет", () => {
    expect(getStoryRing([], nothingViewed)).toBe("none");
  });

  it("есть непросмотренная — кольцо горит градиентом", () => {
    expect(getStoryRing([makeStory(1, hoursAgo(1))], nothingViewed)).toBe("unviewed");
  });

  // Ровно то, ради чего всё затевалось: посмотрел — кольцо серое.
  it("всё просмотрено — кольцо серое", () => {
    expect(getStoryRing([makeStory(1, hoursAgo(1))], allViewed)).toBe("viewed");
  });

  it("кольцо горит, пока осталась хоть одна непросмотренная история", () => {
    const stories = [makeStory(1, hoursAgo(2)), makeStory(2, hoursAgo(1))];

    expect(getStoryRing(stories, (id) => id === 1)).toBe("unviewed");
    expect(getStoryRing(stories, (id) => id === 1 || id === 2)).toBe("viewed");
  });

  it("непросмотренная история «близких друзей» даёт зелёное кольцо", () => {
    expect(getStoryRing([makeStory(1, hoursAgo(1), 1)], nothingViewed)).toBe("closeFriends");
  });

  // Просмотренное всегда серое — зелёное не должно «залипать», как было раньше.
  it("просмотренная история «близких друзей» тоже гаснет в серое", () => {
    expect(getStoryRing([makeStory(1, hoursAgo(1), 1)], allViewed)).toBe("viewed");
  });
});
