export interface DebouncedFunction<T extends (...args: never[]) => void> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
}

/**
 * Pure debounce utility for functions outside of React components.
 * Returns a debounced function equipped with .cancel() and .flush() methods.
 *
 * @param fn The function to debounce.
 * @param delay Delay in milliseconds (default: 300ms).
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay = 300,
): DebouncedFunction<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  function debounced(...args: Parameters<T>) {
    lastArgs = args;
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      if (lastArgs !== null) {
        fn(...lastArgs);
        lastArgs = null;
      }
    }, delay);
  }

  const cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
  };

  const flush = () => {
    if (timer !== null && lastArgs !== null) {
      clearTimeout(timer);
      timer = null;
      fn(...lastArgs);
      lastArgs = null;
    }
  };

  return Object.assign(debounced, { cancel, flush });
}
