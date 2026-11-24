"use client";

import { useEffect, useState } from "react";
import { LogOut, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PLATFORM_ROUTES } from "@/config/routes";

interface SupportSessionBannerProps {
  sessionId: string;
  tenantSlug?: string;
  staffName?: string;
  scope?: string;
  expiresAt: string;
}

export function SupportSessionBanner({
  sessionId,
  tenantSlug,
  staffName,
  scope,
  expiresAt,
}: SupportSessionBannerProps) {
  const [isPending, setIsPending] = useState(false);
  const [exitError, setExitError] = useState(false);
  const expiration = Date.parse(expiresAt);

  useEffect(() => {
    if (!Number.isFinite(expiration)) return;
    const returnToPlatform = () => window.location.replace(PLATFORM_ROUTES.SUPPORT_SESSIONS);
    const timer = window.setTimeout(returnToPlatform, Math.max(0, expiration - Date.now()));
    const controller = new AbortController();
    const poll = window.setInterval(() => {
      void fetch("/api/proxy/users/me", { signal: controller.signal })
        .then((response) => {
          if (response.status === 401 || response.status === 403) returnToPlatform();
        })
        .catch(() => {});
    }, 15_000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(poll);
      controller.abort();
    };
  }, [expiration]);

  const handleEndSession = async () => {
    setIsPending(true);
    setExitError(false);
    try {
      const res = await fetch("/api/platform/support-session/exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error("Unable to end the support session");
      window.location.replace(PLATFORM_ROUTES.SUPPORT_SESSIONS);
    } catch {
      setExitError(true);
      setIsPending(false);
    }
  };

  const isReadOnly = scope === "READ_ONLY";

  return (
    <aside
      aria-label="Platform support session banner"
      className="border-b border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-teal-950/80 px-4 py-2 text-emerald-100 shadow-sm backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <ShieldAlert className="size-3.5" />
          </div>
          <span>
            <strong className="font-semibold text-white">Audited Support Delegation Active</strong>
            {staffName ? (
              <>
                {" "}
                &bull; Operator: <span className="font-semibold text-emerald-200">{staffName}</span>
              </>
            ) : null}
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
            ) : null}
          </span>
          {scope && (
            <span className="rounded-md border border-amber-500/40 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
              {isReadOnly ? "READ-ONLY MODE" : scope.replaceAll("_", " ")}
            </span>
          )}
          {Number.isFinite(expiration) && (
            <span>
              Expires{" "}
              <time dateTime={expiresAt}>
                {new Date(expiration).toISOString().slice(11, 16)} UTC
              </time>
            </span>
          )}
          {exitError && <span role="alert">Unable to end the session. Try again.</span>}
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
