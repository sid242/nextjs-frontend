"use client";

import { type ReactNode } from "react";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";

// import { QueryDevtools } from "./query-devtools";
import { QueryProvider } from "./query-provider";
import { StoreHydrator } from "./store-hydrator";

export function AppProviders({
  children,
  nonce,
  initialLocale,
}: {
  children: ReactNode;
  nonce?: string;
  initialLocale?: import("@/lib/i18n").SupportedLocale;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      <I18nProvider initialLocale={initialLocale}>
        <QueryProvider>
          <TooltipProvider delayDuration={150}>
            <StoreHydrator />
            {children}
            <Toaster richColors closeButton />
            {/* <QueryDevtools /> */}
          </TooltipProvider>
        </QueryProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
