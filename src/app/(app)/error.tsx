"use client";

import { useEffect } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/monitoring";

export default function AppError({
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
    <Alert variant="destructive">
      <AlertTitle>We couldn&apos;t load this page</AlertTitle>
      <AlertDescription>
        <p>
          Please try again. If it keeps happening, contact support
          {error.digest ? ` with reference ${error.digest}` : ""}.
        </p>
        <Button size="sm" variant="outline" onClick={reset}>
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
