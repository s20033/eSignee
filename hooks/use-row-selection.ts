"use client";

import { useState } from "react";

/** Checkbox selection state for a bulk-actions table. Callers should remount (e.g. via a `key` on page/filter) when the underlying row set changes, so stale ids from a previous page don't linger in the selection. */
export const useRowSelection = (ids: string[]) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(ids) : new Set());
  };

  const clear = () => setSelected(new Set());

  return {
    selectedIds: Array.from(selected),
    isSelected: (id: string) => selected.has(id),
    allSelected: ids.length > 0 && ids.every((id) => selected.has(id)),
    toggle,
    toggleAll,
    clear,
    count: selected.size,
  };
};
