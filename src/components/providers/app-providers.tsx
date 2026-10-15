"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { QueryDevtools } from "./query-devtools";
import { QueryProvider } from "./query-provider";
import { StoreHydrator } from "./store-hydrator";

export function AppProviders({ children, nonce }: { children: React.ReactNode; nonce?: string }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      <QueryProvider>
        <StoreHydrator />
        {children}
        <Toaster richColors closeButton />
        <QueryDevtools />
      </QueryProvider>
    </ThemeProvider>
  );
}
