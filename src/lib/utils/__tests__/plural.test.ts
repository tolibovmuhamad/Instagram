import { describe, expect, it } from "vitest";

import { plural, VIEW_FORMS } from "../plural";

describe("plural", () => {
  it("picks the singular form for 1", () => {
    expect(plural(1, VIEW_FORMS)).toBe("просмотр");
    expect(plural(21, VIEW_FORMS)).toBe("просмотр");
  });

  it("picks the 2-4 form", () => {
    expect(plural(2, VIEW_FORMS)).toBe("просмотра");
    expect(plural(34, VIEW_FORMS)).toBe("просмотра");
  });

  it("picks the many form for 5-0 and for 0", () => {
    expect(plural(0, VIEW_FORMS)).toBe("просмотров");
    expect(plural(5, VIEW_FORMS)).toBe("просмотров");
    expect(plural(100, VIEW_FORMS)).toBe("просмотров");
  });

  // 11-14 — исключение: несмотря на окончания 1/2/3/4, форма всегда «просмотров».
  it("handles the 11-14 exception", () => {
    expect(plural(11, VIEW_FORMS)).toBe("просмотров");
    expect(plural(12, VIEW_FORMS)).toBe("просмотров");
    expect(plural(114, VIEW_FORMS)).toBe("просмотров");
  });
});
