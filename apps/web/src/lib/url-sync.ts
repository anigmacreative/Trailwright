// URL sync configuration
export const URL_SYNC_ENABLED = process.env.NEXT_PUBLIC_URL_SYNC === 'true';

// Debounce utility for URL sync operations
export function createDebouncedUrlSync<T extends (...args: any[]) => void>(
  fn: T,
  delay: number = 500
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout;
  let lastValue: string | null = null;

  const debounced = ((...args: any[]) => {
    const currentValue = JSON.stringify(args);
    
    // Skip if same value as last time
    if (currentValue === lastValue) {
      return;
    }
    
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      lastValue = currentValue;
      fn(...args);
    }, delay);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    clearTimeout(timeoutId);
  };

  return debounced;
}