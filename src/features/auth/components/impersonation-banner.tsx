"use client";

import { LogOutIcon, VenetianMaskIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useStopImpersonation } from "../queries";

interface ImpersonationBannerProps {
  userName?: string;
}

export function ImpersonationBanner({ userName }: ImpersonationBannerProps) {
  const stopMutation = useStopImpersonation();

  return (
    <aside
      aria-label="Impersonation mode notification"
      className="border-b border-amber-500/30 bg-amber-500/15 px-4 py-2 text-amber-900 dark:text-amber-200"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="flex items-center gap-2.5 text-xs font-medium">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
            <VenetianMaskIcon className="size-3.5" />
          </div>
          <span>
            Impersonation Session Active: Viewing platform as{" "}
            <strong className="text-foreground font-semibold">{userName ?? "User"}</strong>. All
            actions are dual-audited.
          </span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => stopMutation.mutate()}
          disabled={stopMutation.isPending}
          className="bg-background/80 h-7 shrink-0 gap-1.5 border-amber-500/40 text-xs font-semibold hover:bg-amber-500/20"
        >
          <LogOutIcon className="size-3" />
          {stopMutation.isPending ? "Exiting…" : "Exit Impersonation"}
        </Button>
      </div>
    </aside>
  );
}
