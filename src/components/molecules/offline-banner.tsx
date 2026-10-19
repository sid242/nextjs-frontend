"use client";

import { useState, useSyncExternalStore } from "react";
import { CheckCircle2Icon, GaugeIcon, WifiOffIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useNetworkStatus } from "@/lib/hooks";

const emptySubscribe = () => () => {};

export function OfflineBanner() {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const {
    isOnline,
    isBackOnline,
    isSlowConnection,
    effectiveType,
    checkConnection,
    dismissBackOnline,
  } = useNetworkStatus();

  const [checking, setChecking] = useState<boolean>(false);
  const [slowDismissed, setSlowDismissed] = useState<boolean>(false);

  if (!isMounted) return null;

  const handleRetry = async () => {
    setChecking(true);
    await checkConnection();
    setChecking(false);
  };

  // 1. Offline Banner (Highest priority)
  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="border-warning/30 bg-warning/15 text-warning-foreground dark:text-warning flex items-center justify-between border-b px-4 py-2 text-xs font-medium transition-all"
      >
        <div className="flex items-center gap-2">
          <WifiOffIcon className="text-warning size-4 shrink-0 animate-pulse" />
          <span>
            You are currently offline. Actions and changes will automatically sync once your
            connection is restored.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleRetry()}
            disabled={checking}
            className="border-warning/40 hover:bg-warning/20 text-warning-foreground h-7 gap-1.5 px-2.5 text-xs font-medium"
          >
            {checking ? <Spinner className="size-3" /> : null}
            <span>{checking ? "Checking…" : "Retry"}</span>
          </Button>
        </div>
      </div>
    );
  }

  // 2. Back Online Banner (Temporary notification)
  if (isBackOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="animate-in fade-in slide-in-from-top-1 flex items-center justify-between border-b border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-xs font-medium text-emerald-950 duration-200 dark:text-emerald-200"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Back online — Connection to the server has been restored.</span>
        </div>
        <button
          type="button"
          onClick={dismissBackOnline}
          aria-label="Dismiss banner"
          className="rounded p-1 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
    );
  }

  // 3. Low Connectivity Warning
  if (isSlowConnection && !slowDismissed) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-between border-b border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-medium text-sky-950 transition-all dark:text-sky-200"
      >
        <div className="flex items-center gap-2">
          <GaugeIcon className="size-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
          <span>
            Slow connection detected ({effectiveType.toUpperCase()}) — server responses and uploads
            might take longer than usual.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSlowDismissed(true)}
          aria-label="Dismiss slow network warning"
          className="rounded p-1 text-sky-700 hover:bg-sky-500/20 dark:text-sky-300"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
    );
  }

  return null;
}
