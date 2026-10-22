"use client";

import { type ReactNode } from "react";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// import { QueryDevtools } from "./query-devtools";
import { QueryProvider } from "./query-provider";
import { StoreHydrator } from "./store-hydrator";

export function AppProviders({ children, nonce }: { children: ReactNode; nonce?: string }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      <QueryProvider>
        <TooltipProvider delayDuration={150}>
          <StoreHydrator />
          {children}
          <Toaster richColors closeButton />
          {/* <QueryDevtools /> */}
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
