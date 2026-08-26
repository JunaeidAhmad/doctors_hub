import { useState, useEffect } from 'react';

/**
 * Hook to debounce any fast-changing value (e.g. search input text)
 * @param {any} value - The input value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 350ms)
 * @returns {any} - The debounced value
 */
export function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
