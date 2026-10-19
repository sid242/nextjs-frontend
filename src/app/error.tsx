"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/monitoring";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest });
  }, [error]);

  return (
    <main id="main" className="grid min-h-screen place-items-center p-6 text-center">
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="text-muted-foreground">An unexpected error occurred. You can try again.</p>
        {error.digest ? (
          <p className="text-muted-foreground text-xs">Reference: {error.digest}</p>
        ) : null}
        <div>
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </main>
  );
}
