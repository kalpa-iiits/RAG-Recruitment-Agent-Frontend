import { useEffect, useState } from 'react';

/**
 * A value that settles `delay` ms after it stops changing.
 *
 * Search boxes feed the server-side filters, so without this every keystroke
 * would be its own request and the results would race each other.
 */
export function useDebounced<T>(value: T, delay = 300): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
