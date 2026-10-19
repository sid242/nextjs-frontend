"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface NetworkConnectionInfo {
  /** Effective connection type reported by the browser (4g, 3g, 2g, slow-2g, or unknown) */
  effectiveType: "slow-2g" | "2g" | "3g" | "4g" | "unknown";
  /** Estimated round-trip time in milliseconds */
  rtt?: number;
  /** Estimated downlink bandwidth in megabits per second */
  downlink?: number;
  /** Whether the user has requested a reduced data usage mode */
  saveData: boolean;
}

export interface UseNetworkStatusReturn extends NetworkConnectionInfo {
  /** True when the browser has network connectivity */
  isOnline: boolean;
  /** True briefly (4 seconds) after transitioning from offline to online */
  isBackOnline: boolean;
  /** True when on 2g/slow-2g, high latency (rtt >= 1500ms), or very low bandwidth */
  isSlowConnection: boolean;
  /** Manually test connection by performing a lightweight ping to the health endpoint */
  checkConnection: () => Promise<boolean>;
  /** Dismiss the "back online" confirmation banner early */
  dismissBackOnline: () => void;
}

interface NetworkInformationApi extends EventTarget {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  rtt?: number;
  downlink?: number;
  saveData?: boolean;
  addEventListener: (type: "change", listener: EventListener) => void;
  removeEventListener: (type: "change", listener: EventListener) => void;
}

/** Extracts network speed and latency metrics from the browser's NetworkInformation API if supported. */
export function getNetworkConnectionInfo(): NetworkConnectionInfo {
  if (typeof navigator === "undefined") {
    return { effectiveType: "unknown", saveData: false };
  }

  const nav = navigator as unknown as { connection?: NetworkInformationApi };
  const conn = nav.connection;
  if (!conn) {
    return { effectiveType: "unknown", saveData: false };
  }

  return {
    effectiveType: conn.effectiveType ?? "unknown",
    rtt: typeof conn.rtt === "number" ? conn.rtt : undefined,
    downlink: typeof conn.downlink === "number" ? conn.downlink : undefined,
    saveData: Boolean(conn.saveData),
  };
}

/** Determines if a given network profile indicates low connectivity. */
export function isSlowNetworkConnection(info: NetworkConnectionInfo): boolean {
  if (info.effectiveType === "slow-2g" || info.effectiveType === "2g") {
    return true;
  }
  if (typeof info.rtt === "number" && info.rtt >= 1500) {
    return true;
  }
  if (typeof info.downlink === "number" && info.downlink > 0 && info.downlink < 0.4) {
    return true;
  }
  return false;
}

/**
 * Hook to track online, back-online, and low connectivity/slow network status
 * across client components.
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const [isBackOnline, setIsBackOnline] = useState<boolean>(false);
  const [connectionInfo, setConnectionInfo] = useState<NetworkConnectionInfo>(() =>
    getNetworkConnectionInfo(),
  );

  const wasOfflineRef = useRef<boolean>(false);
  const backOnlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offlineDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnloadingRef = useRef<boolean>(false);

  const dismissBackOnline = useCallback(() => {
    if (backOnlineTimerRef.current !== null) {
      clearTimeout(backOnlineTimerRef.current);
      backOnlineTimerRef.current = null;
    }
    setIsBackOnline(false);
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`/api/health?_t=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const ok = res.ok;
      setIsOnline(ok);
      return ok;
    } catch {
      setIsOnline(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      isUnloadingRef.current = true;
    };

    const handleOnline = () => {
      // Clear any pending offline transition
      if (offlineDebounceTimerRef.current !== null) {
        clearTimeout(offlineDebounceTimerRef.current);
        offlineDebounceTimerRef.current = null;
      }

      setIsOnline(true);
      if (wasOfflineRef.current) {
        setIsBackOnline(true);
        if (backOnlineTimerRef.current !== null) {
          clearTimeout(backOnlineTimerRef.current);
        }
        backOnlineTimerRef.current = setTimeout(() => {
          setIsBackOnline(false);
          wasOfflineRef.current = false;
        }, 4000);
      }
    };

    const handleOffline = () => {
      // Ignore offline events that fire when refreshing or navigating away
      if (isUnloadingRef.current) {
        return;
      }

      // Debounce offline transition by 600ms to eliminate reload flickers
      if (offlineDebounceTimerRef.current !== null) {
        clearTimeout(offlineDebounceTimerRef.current);
      }

      offlineDebounceTimerRef.current = setTimeout(() => {
        if (!isUnloadingRef.current && typeof navigator !== "undefined" && !navigator.onLine) {
          wasOfflineRef.current = true;
          setIsOnline(false);
          dismissBackOnline();
        }
      }, 600);
    };

    const updateConnectionInfo = () => {
      setConnectionInfo(getNetworkConnectionInfo());
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const nav = navigator as unknown as { connection?: NetworkInformationApi };
    const conn = nav.connection;
    if (conn?.addEventListener) {
      conn.addEventListener("change", updateConnectionInfo);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (conn?.removeEventListener) {
        conn.removeEventListener("change", updateConnectionInfo);
      }
      if (backOnlineTimerRef.current !== null) {
        clearTimeout(backOnlineTimerRef.current);
      }
      if (offlineDebounceTimerRef.current !== null) {
        clearTimeout(offlineDebounceTimerRef.current);
      }
    };
  }, [dismissBackOnline]);

  const isSlowConnection = isSlowNetworkConnection(connectionInfo);

  return {
    isOnline,
    isBackOnline,
    isSlowConnection,
    effectiveType: connectionInfo.effectiveType,
    rtt: connectionInfo.rtt,
    downlink: connectionInfo.downlink,
    saveData: connectionInfo.saveData,
    checkConnection,
    dismissBackOnline,
  };
}
