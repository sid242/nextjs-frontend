"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseCountdownOptions {
  /**
   * The countdown starting duration in seconds.
   * @default 60
   */
  seconds?: number;
  /**
   * Interval step in milliseconds between timer updates.
   * @default 1000
   */
  intervalMs?: number;
  /**
   * Target count at which the countdown stops.
   * @default 0
   */
  countStop?: number;
  /**
   * Whether to automatically start the timer upon mount.
   * @default false
   */
  autoStart?: boolean;
  /**
   * Optional callback triggered when the countdown reaches countStop.
   */
  onComplete?: () => void;
}

export interface UseCountdownReturn {
  /** Current remaining countdown seconds */
  count: number;
  /** Whether the countdown timer is actively ticking */
  isRunning: boolean;
  /** Whether the countdown has completed (count <= countStop) */
  isComplete: boolean;
  /** Start the countdown timer. Optionally pass a custom duration in seconds. */
  start: (customSeconds?: number) => void;
  /** Pause the countdown timer at its current count */
  pause: () => void;
  /** Resume counting down from current paused value */
  resume: () => void;
  /** Stop and reset the timer back to initial seconds */
  reset: () => void;
  /** Formatted string representation (e.g. "01:30" or "00:45") */
  formatted: string;
  /** Numeric breakdown into hours, minutes, and seconds */
  time: {
    hours: number;
    minutes: number;
    seconds: number;
  };
}

/** Formats total seconds into a mm:ss or hh:mm:ss string */
export function formatCountdownTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safeSeconds / 3600);
  const m = Math.floor((safeSeconds % 3600) / 60);
  const s = safeSeconds % 60;

  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Production-ready countdown timer hook for React 19 / Next.js.
 * Tracks wall-clock timestamp drift to ensure accuracy even when the browser
 * tab is minimized or throttled in the background.
 *
 * @param options Countdown configuration options or starting seconds.
 */
export function useCountdown(options?: UseCountdownOptions | number): UseCountdownReturn {
  const opts = typeof options === "number" ? { seconds: options } : (options ?? {});
  const { seconds = 60, intervalMs = 1000, countStop = 0, autoStart = false, onComplete } = opts;

  const [count, setCount] = useState<number>(seconds);
  const [isRunning, setIsRunning] = useState<boolean>(autoStart);

  const onCompleteRef = useRef(onComplete);
  const countRef = useRef(count);
  const endTimeRef = useRef<number | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  const pause = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;
  }, []);

  const start = useCallback(
    (customSeconds?: number) => {
      const initial = customSeconds !== undefined ? customSeconds : seconds;
      setCount(initial);
      countRef.current = initial;

      if (initial <= countStop) {
        setIsRunning(false);
        endTimeRef.current = null;
        onCompleteRef.current?.();
        return;
      }

      endTimeRef.current = Date.now() + initial * 1000;
      setIsRunning(true);
    },
    [countStop, seconds],
  );

  const resume = useCallback(() => {
    if (countRef.current <= countStop) return;
    endTimeRef.current = Date.now() + countRef.current * 1000;
    setIsRunning(true);
  }, [countStop]);

  const reset = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;
    setCount(seconds);
    countRef.current = seconds;
  }, [seconds]);

  // Synchronize active timer subscription
  useEffect(() => {
    if (!isRunning) return;

    if (countRef.current <= countStop) {
      setIsRunning(false);
      onCompleteRef.current?.();
      return;
    }

    if (endTimeRef.current === null) {
      endTimeRef.current = Date.now() + countRef.current * 1000;
    }

    const intervalId = setInterval(() => {
      if (endTimeRef.current === null) return;
      const remaining = Math.max(countStop, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setCount(remaining);
      countRef.current = remaining;

      if (remaining <= countStop) {
        clearInterval(intervalId);
        endTimeRef.current = null;
        setIsRunning(false);
        onCompleteRef.current?.();
      }
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning, countStop, intervalMs]);

  const hours = Math.floor(count / 3600);
  const minutes = Math.floor((count % 3600) / 60);
  const remainingSeconds = count % 60;

  return {
    count,
    isRunning,
    isComplete: count <= countStop,
    start,
    pause,
    resume,
    reset,
    formatted: formatCountdownTime(count),
    time: {
      hours,
      minutes,
      seconds: remainingSeconds,
    },
  };
}
