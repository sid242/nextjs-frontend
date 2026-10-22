"use client";

import React, { useMemo, useState } from "react";
import { EyeIcon, LaptopIcon, SmartphoneIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { STANDARD_VARIABLES } from "../constants";

interface DevicePreviewProps {
  htmlContent: string;
  subject?: string;
  customVariables?: Record<string, string>;
  className?: string;
}

export function DevicePreview({
  htmlContent,
  subject = "",
  customVariables = {},
  className = "",
}: DevicePreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  // Build replacement map from standard samples + custom overrides
  const sampleMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const v of STANDARD_VARIABLES) {
      map[v.key] = v.sample;
    }
    return { ...map, ...customVariables };
  }, [customVariables]);

  const renderedSubject = useMemo(() => {
    return subject.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key) => sampleMap[key] ?? `{{${key}}}`);
  }, [subject, sampleMap]);

  const renderedHtml = useMemo(() => {
    if (!htmlContent) {
      return '<div style="font-family:sans-serif;padding:30px;text-align:center;color:#888;">No content entered yet.</div>';
    }
    return htmlContent.replace(
      /\{\{([a-zA-Z0-9_]+)\}\}/g,
      (_, key) => sampleMap[key] ?? `{{${key}}}`,
    );
  }, [htmlContent, sampleMap]);

  return (
    <div
      className={`border-border bg-card flex flex-col overflow-hidden rounded-lg border ${className}`}
    >
      {/* Device Toolbar */}
      <div className="border-border bg-muted/40 flex items-center justify-between border-b px-3 py-2 text-xs">
        <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
          <EyeIcon className="text-primary size-3.5" />
          <span>Interactive Live Preview</span>
        </div>
        <div className="border-border bg-background flex items-center rounded-md border p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDevice("desktop")}
            className={`h-6 gap-1 rounded-sm px-2 text-xs ${
              device === "desktop"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground"
            }`}
          >
            <LaptopIcon className="size-3" />
            <span>Desktop</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDevice("mobile")}
            className={`h-6 gap-1 rounded-sm px-2 text-xs ${
              device === "mobile"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground"
            }`}
          >
            <SmartphoneIcon className="size-3" />
            <span>Mobile</span>
          </Button>
        </div>
      </div>

      {/* Simulated Email Client Envelope */}
      <div className="border-border/60 bg-muted/20 text-muted-foreground space-y-1 border-b px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-foreground/80 w-12 font-semibold">From:</span>
          <span>Savitara Realty &lt;info@savitara.com&gt;</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-foreground/80 w-12 font-semibold">To:</span>
          <span>
            {sampleMap["customer_name"] || "Customer"} &lt;
            {sampleMap["customer_email"] || "recipient@example.com"}&gt;
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-foreground/80 w-12 font-semibold">Subject:</span>
          <span className="text-foreground font-medium">{renderedSubject || "(No subject)"}</span>
        </div>
      </div>

      {/* Email Body Frame */}
      <div className="flex max-h-[550px] min-h-[380px] flex-1 items-start justify-center overflow-y-auto bg-neutral-100 p-4 dark:bg-neutral-900/50">
        <div
          className={`overflow-hidden rounded-md border border-neutral-200 bg-white text-neutral-900 shadow-sm transition-all duration-300 ${
            device === "desktop" ? "w-full max-w-[620px]" : "w-[360px]"
          }`}
        >
          <div
            className="prose prose-sm dark:prose-invert max-w-none p-4"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      </div>
    </div>
  );
}
