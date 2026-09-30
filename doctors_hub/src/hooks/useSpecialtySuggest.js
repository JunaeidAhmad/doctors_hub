import { useState, useEffect, useRef } from 'react';
import useDebounce from './useDebounce';
import { BASE_URL, fetchWithDeduplicationAndCache, fetchWithTimeout, handleResponse } from '../services/api/core';

/**
 * Custom hook to suggest specialties with 200ms debounce, AbortController, and 60s cache.
 * @param {string} query
 * @param {number} limit
 * @returns {{ items: Array, isLoading: boolean }}
 */
export function useSpecialtySuggest(query, limit = 8) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 200);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const trimmed = (debouncedQuery || '').trim();
    if (!trimmed) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let isCurrent = true;
    setIsLoading(true);

    const cacheKey = `spec_suggest_${trimmed.toLowerCase()}_${limit}`;

    fetchWithDeduplicationAndCache(
      cacheKey,
      async () => {
        const url = new URL(`${BASE_URL}/specialties/suggest/`);
        url.searchParams.set('q', trimmed);
        url.searchParams.set('limit', String(limit));
        const res = await fetchWithTimeout(url, {
          signal: controller.signal,
        });
        return handleResponse(res);
      },
      60000 // 60-second cache
    )
      .then((data) => {
        if (isCurrent && !controller.signal.aborted) {
          setItems(Array.isArray(data) ? data : []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isCurrent && !controller.signal.aborted) {
          if (err.name !== 'AbortError') {
            console.error('Failed to suggest specialties:', err);
          }
          setItems([]);
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [debouncedQuery, limit]);

  return { items, isLoading };
}

export default useSpecialtySuggest;
