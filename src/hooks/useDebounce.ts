/**
 * @file src/hooks/useDebounce.ts
 * @description Custom hook for delaying value updates (debouncing).
 *
 * @why-it-exists
 * Prevents heavy calculations or multiple fast state updates (like filtering catalog lists) 
 * on every character typed into a search input.
 */

import { useState, useEffect } from 'react';

export default function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
