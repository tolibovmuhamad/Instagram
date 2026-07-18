/**
 * Схлопывает дубликаты в склеенных страницах бесконечного списка.
 *
 * Пагинация бэкенда — по номеру страницы (offset). Если между запросами соседних страниц
 * лента изменилась (добавили/удалили пост, поменялся порядок), элемент на границе страниц
 * приходит дважды: один и тот же id оказывается и на странице N, и на N+1. После
 * `pages.flatMap((p) => p.items)` это давало React-ошибку
 * «Encountered two children with the same key» и задвоение карточек.
 *
 * Оставляем первое вхождение каждого id, порядок сохраняется.
 */
export function dedupeById<T extends { id: PropertyKey }>(items: T[]): T[] {
  const seen = new Set<PropertyKey>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}
