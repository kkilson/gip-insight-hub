import { useState, useCallback, useMemo } from 'react';

export function useBulkSelection<T extends { id: string }>(items: T[] | undefined) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allIds = useMemo(() => items?.map(i => i.id) || [], [items]);

  const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));
  const isSomeSelected = selectedIds.size > 0;
  const isIndeterminate = isSomeSelected && !isAllSelected;

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }, [isAllSelected, allIds]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const selectedItems = useMemo(
    () => items?.filter(i => selectedIds.has(i.id)) || [],
    [items, selectedIds]
  );

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    isAllSelected,
    isIndeterminate,
    isSomeSelected,
    toggle,
    toggleAll,
    clearSelection,
    isSelected: (id: string) => selectedIds.has(id),
  };
}
