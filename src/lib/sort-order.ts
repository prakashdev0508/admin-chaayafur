/** Stable list order: sortOrder ASC, then id ASC (matches API category/banner lists). */
export function bySortOrderThenId<T extends { id: number; sortOrder?: number }>(
  a: T,
  b: T,
) {
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id;
}

/**
 * Swap two items in the sorted list, then assign contiguous sortOrder 0..n-1.
 * Avoids no-op swaps when adjacent items share the same sortOrder (ties broken by id).
 */
export function reindexAfterSwap<T extends { id: number; sortOrder?: number }>(
  items: T[],
  currentId: number,
  neighborId: number,
): Array<{ id: number; sortOrder: number }> {
  const ordered = [...items].sort(bySortOrderThenId);
  const currentIndex = ordered.findIndex((item) => item.id === currentId);
  const neighborIndex = ordered.findIndex((item) => item.id === neighborId);
  if (currentIndex < 0 || neighborIndex < 0 || currentIndex === neighborIndex) {
    return [];
  }

  const next = [...ordered];
  const temp = next[currentIndex];
  next[currentIndex] = next[neighborIndex];
  next[neighborIndex] = temp;

  return next.map((item, index) => ({ id: item.id, sortOrder: index }));
}

/** Only rows whose sortOrder actually changes after the swap + reindex. */
export function changedSortOrders<T extends { id: number; sortOrder?: number }>(
  items: T[],
  currentId: number,
  neighborId: number,
): Array<{ id: number; sortOrder: number }> {
  const previous = new Map(
    items.map((item) => [item.id, item.sortOrder ?? 0] as const),
  );
  return reindexAfterSwap(items, currentId, neighborId).filter(
    (row) => previous.get(row.id) !== row.sortOrder,
  );
}
