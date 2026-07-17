import { beforeEach, describe, expect, it } from "vitest";

import { useStoryViewsStore } from "../storyViews";

const reset = () => useStoryViewsStore.setState({ byUser: {} });

describe("useStoryViewsStore", () => {
  beforeEach(reset);

  it("запоминает просмотренную историю", () => {
    const { markViewed, hasViewed } = useStoryViewsStore.getState();

    expect(hasViewed("user-1", 10)).toBe(false);
    markViewed("user-1", 10);
    expect(useStoryViewsStore.getState().hasViewed("user-1", 10)).toBe(true);
  });

  // Кружок гаснет для того, кто смотрел: на общем устройстве отметки одного аккаунта
  // не должны гасить кольца в другом.
  it("не смешивает отметки разных аккаунтов", () => {
    useStoryViewsStore.getState().markViewed("user-1", 10);

    expect(useStoryViewsStore.getState().hasViewed("user-2", 10)).toBe(false);
  });

  // markViewed зовётся из эффекта вьюера на каждой смене сегмента, в том числе при
  // повторном заходе — тот же id не должен ни дублироваться, ни дёргать подписчиков.
  it("повторный просмотр не меняет состояние", () => {
    const { markViewed } = useStoryViewsStore.getState();
    markViewed("user-1", 10);
    const afterFirst = useStoryViewsStore.getState().byUser;

    markViewed("user-1", 10);

    expect(useStoryViewsStore.getState().byUser).toBe(afterFirst);
    expect(useStoryViewsStore.getState().byUser["user-1"]).toEqual([10]);
  });

  // Истории живут 24 часа, а id копятся вечно — список обязан быть ограничен, иначе
  // localStorage пухнет мёртвыми отметками.
  it("хранит только последние 500 отметок, вытесняя самые старые", () => {
    const { markViewed } = useStoryViewsStore.getState();
    for (let id = 1; id <= 520; id += 1) {
      markViewed("user-1", id);
    }

    const stored = useStoryViewsStore.getState().byUser["user-1"];
    expect(stored).toHaveLength(500);
    expect(stored.at(0)).toBe(21);
    expect(stored.at(-1)).toBe(520);
    expect(useStoryViewsStore.getState().hasViewed("user-1", 1)).toBe(false);
  });
});
