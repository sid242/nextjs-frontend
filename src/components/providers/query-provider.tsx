"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/query/client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Deliberately NOT useState: see getQueryClient (browser singleton, fresh client per server render).
  const queryClient = getQueryClient();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.__TANSTACK_QUERY_CLIENT__ = queryClient;
    }
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
