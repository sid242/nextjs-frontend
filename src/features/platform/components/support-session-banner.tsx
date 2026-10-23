"use client";

import { useState } from "react";
import { LogOut, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SupportSessionBannerProps {
  sessionId?: string;
  tenantSlug?: string;
}

export function SupportSessionBanner({ sessionId, tenantSlug }: SupportSessionBannerProps) {
  const [isPending, setIsPending] = useState(false);

  const handleEndSession = async () => {
    setIsPending(true);
    try {
      await fetch("/api/platform/support-session/exit", {
        method: "POST",
      });
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Full page navigation needed to clear application state
      window.location.assign("/platform/tenants");
    } catch {
      setIsPending(false);
    }
  };

  return (
    <aside
      aria-label="Platform support session banner"
      className="border-b border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-teal-950/80 px-4 py-2 text-emerald-100 shadow-sm backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="flex items-center gap-2.5 text-xs font-medium">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <ShieldAlert className="size-3.5" />
          </div>
          <span>
            <strong className="font-semibold text-white">Audited Support Delegation Active</strong>
            {tenantSlug ? (
              <>
                {" "}
                &bull; Workspace: <span className="font-mono text-emerald-300">{tenantSlug}</span>
              </>
            ) : null}
            {sessionId ? (
              <>
                {" "}
                &bull; Session:{" "}
                <span className="font-mono text-[11px] text-emerald-400">
                  {sessionId.slice(0, 8)}...
                </span>
              </>
            ) : null}{" "}
            &bull; All actions are recorded to the platform compliance audit log.
          </span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleEndSession}
          disabled={isPending}
          className="h-7 shrink-0 gap-1.5 border-emerald-500/40 bg-emerald-950/40 text-xs font-semibold text-emerald-100 hover:bg-emerald-800/40 hover:text-white"
        >
          <LogOut className="size-3" />
          {isPending ? "Concluding..." : "Exit Support Session"}
        </Button>
      </div>
    </aside>
  );
}
