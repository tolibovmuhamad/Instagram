import { describe, expect, it } from "vitest";

import { formatTimeAgoShort } from "../date";

const NOW = new Date("2026-07-13T12:00:00Z");

const secondsAgo = (seconds: number) => new Date(NOW.getTime() - seconds * 1000);

describe("formatTimeAgoShort", () => {
  it("не опускается ниже одной секунды (даты «из будущего» из-за расхождения часов)", () => {
    expect(formatTimeAgoShort(secondsAgo(0), NOW)).toBe("1 с.");
    expect(formatTimeAgoShort(secondsAgo(-30), NOW)).toBe("1 с.");
  });

  it("секунды и минуты", () => {
    expect(formatTimeAgoShort(secondsAgo(45), NOW)).toBe("45 с.");
    expect(formatTimeAgoShort(secondsAgo(60), NOW)).toBe("1 мин.");
    expect(formatTimeAgoShort(secondsAgo(59 * 60), NOW)).toBe("59 мин.");
  });

  it("часы и дни", () => {
    expect(formatTimeAgoShort(secondsAgo(3600), NOW)).toBe("1 ч.");
    expect(formatTimeAgoShort(secondsAgo(23 * 3600), NOW)).toBe("23 ч.");
    expect(formatTimeAgoShort(secondsAgo(86400), NOW)).toBe("1 дн.");
    expect(formatTimeAgoShort(secondsAgo(6 * 86400), NOW)).toBe("6 дн.");
  });

  it("недели и годы", () => {
    expect(formatTimeAgoShort(secondsAgo(7 * 86400), NOW)).toBe("1 нед.");
    expect(formatTimeAgoShort(secondsAgo(51 * 7 * 86400), NOW)).toBe("51 нед.");
    expect(formatTimeAgoShort(secondsAgo(370 * 86400), NOW)).toBe("1 г.");
  });

  it("принимает ISO-строку", () => {
    expect(formatTimeAgoShort("2026-07-13T11:00:00Z", NOW)).toBe("1 ч.");
  });
});
