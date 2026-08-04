import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

type EntityWithId = { id: string };

const SCROLL_DELAY_MS = 80;
const FOCUS_RING_MS = 4000;

/**
 * Reads `?highlight=` (or custom param), opens the matching entity once data is loaded,
 * then clears the query param while keeping a short-lived focus id for scroll/ring UI.
 */
export function useEntityDeepLink<T extends EntityWithId>(
  items: T[],
  onOpen: (item: T) => void,
  paramName = 'highlight'
): { focusedId: string | null } {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get(paramName);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const handledRef = useRef<string | null>(null);
  const onOpenRef = useRef(onOpen);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  const clearParam = useCallback(() => {
    if (!searchParams.has(paramName)) return;
    const next = new URLSearchParams(searchParams);
    next.delete(paramName);
    setSearchParams(next, { replace: true });
  }, [paramName, searchParams, setSearchParams]);

  useEffect(() => {
    if (!highlightId || items.length === 0) return;
    if (handledRef.current === highlightId) return;

    const match = items.find((item) => String(item.id) === String(highlightId));
    handledRef.current = highlightId;

    if (match) {
      onOpenRef.current(match);
      setFocusedId(highlightId);
      window.setTimeout(() => {
        const el = document.querySelector(`[data-entity-id="${CSS.escape(highlightId)}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, SCROLL_DELAY_MS);
      window.setTimeout(() => {
        setFocusedId(null);
      }, FOCUS_RING_MS);
    }

    clearParam();
  }, [highlightId, items, clearParam]);

  return { focusedId };
}

export default useEntityDeepLink;
