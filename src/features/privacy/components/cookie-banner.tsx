"use client";

import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useRecordConsent } from "../queries";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const { mutate: recordConsent } = useRecordConsent();

  useEffect(() => {
    // Check in next tick to avoid cascading synchronous render in effect body
    const id = setTimeout(() => {
      try {
        const consent = localStorage.getItem("cookie_consent");
        if (!consent) {
          setVisible(true);
        }
      } catch {
        // Storage not available
      }
    }, 50);
    return () => clearTimeout(id);
  }, []);

  const handleConsent = (mode: "essential" | "all") => {
    try {
      localStorage.setItem("cookie_consent", mode);
    } catch {
      // Ignore storage errors
    }
    setVisible(false);

    recordConsent({
      type: "COOKIES",
      version: mode === "all" ? "all:2026.1" : "essential:2026.1",
    });
  };

  if (!visible) return null;

  return (
    <div className="border-border/80 bg-background/95 fixed right-4 bottom-4 z-50 max-w-sm rounded-lg border p-4 shadow-lg backdrop-blur-xs">
      <div className="flex items-start gap-3">
        <Cookie className="text-primary mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <p className="text-foreground font-semibold">Privacy &amp; Cookie Preferences</p>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground -mr-1 h-5 w-5"
              onClick={() => handleConsent("essential")}
              aria-label="Close cookie banner"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            We use strictly necessary cookies to keep you signed in and protect workspace security.
            We comply with GDPR and India DPDP guidelines.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => handleConsent("essential")}
            >
              Essential Only
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => handleConsent("all")}
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
