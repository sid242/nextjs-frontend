"use client";

import { useMemo, useState } from "react";
import { CheckIcon, CopyIcon, EyeIcon, LaptopIcon, SmartphoneIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { STANDARD_VARIABLES } from "../constants";

interface DevicePreviewProps {
  htmlContent: string;
  subject?: string;
  senderName?: string;
  fromEmail?: string;
  replyTo?: string;
  customVariables?: Record<string, string>;
  className?: string;
  bodyMaxHeight?: string;
}

export function DevicePreview({
  htmlContent,
  subject = "",
  senderName,
  fromEmail,
  replyTo,
  customVariables = {},
  className = "",
  bodyMaxHeight,
}: DevicePreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [copiedSubject, setCopiedSubject] = useState(false);

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
      return '<div style="font-family:sans-serif;padding:40px 20px;text-align:center;color:#888;">No email body content entered yet.</div>';
    }
    return htmlContent.replace(
      /\{\{([a-zA-Z0-9_]+)\}\}/g,
      (_, key) => sampleMap[key] ?? `{{${key}}}`,
    );
  }, [htmlContent, sampleMap]);

  const copySubject = async () => {
    if (renderedSubject) {
      await navigator.clipboard.writeText(renderedSubject);
      setCopiedSubject(true);
      toast.success("Subject copied to clipboard");
      setTimeout(() => setCopiedSubject(false), 2000);
    }
  };

  return (
    <div
      className={`border-border/80 bg-card flex flex-col overflow-hidden rounded-2xl border shadow-xs ${className}`}
    >
      {/* Device Toolbar: BrixUI Segmented Controller */}
      <div className="border-border/60 bg-muted/30 flex flex-wrap items-center justify-between gap-2 border-b px-3.5 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-md">
            <EyeIcon className="size-3.5" />
          </div>
          <div>
            <span className="text-foreground text-xs font-semibold sm:text-sm">
              Interactive Preview
            </span>
            <span className="text-muted-foreground hidden text-[11px] sm:ml-2 sm:inline">
              (Live merge variable resolution)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-border/60 bg-background/50 text-muted-foreground font-mono text-[10px]"
          >
            {device === "desktop" ? "640px · Desktop" : "375px · Mobile"}
          </Badge>

          {/* Segmented Device Switcher */}
          <div className="border-border/60 bg-background/80 flex items-center rounded-lg border p-0.5 shadow-2xs">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDevice("desktop")}
              className={`h-7 gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all ${
                device === "desktop"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LaptopIcon className="size-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDevice("mobile")}
              className={`h-7 gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all ${
                device === "mobile"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <SmartphoneIcon className="size-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Simulated Email Client Envelope: BrixUI Elevated Header Card */}
      <div className="border-border/50 bg-muted/15 border-b px-3.5 py-3 text-xs sm:px-5">
        <div className="grid gap-1.5 sm:gap-2">
          {/* From line */}
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground w-16 shrink-0 text-[11px] font-medium tracking-wider uppercase">
              From:
            </span>
            <span className="text-foreground truncate font-medium">
              {senderName ? `${senderName} ` : "Acme Workspace "}
              <span className="text-muted-foreground font-mono font-normal">
                &lt;{fromEmail || "notifications@acme.com"}&gt;
              </span>
            </span>
          </div>

          {/* Reply-To line */}
          {replyTo && (
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground w-16 shrink-0 text-[11px] font-medium tracking-wider uppercase">
                Reply-To:
              </span>
              <span className="text-foreground truncate font-mono text-[11px]">
                &lt;{replyTo}&gt;
              </span>
            </div>
          )}

          {/* To line */}
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground w-16 shrink-0 text-[11px] font-medium tracking-wider uppercase">
              To:
            </span>
            <span className="text-foreground truncate">
              {sampleMap["customer_name"] || "Alex Mercer"}{" "}
              <span className="text-muted-foreground font-mono text-[11px]">
                &lt;{sampleMap["customer_email"] || "alex.mercer@example.com"}&gt;
              </span>
            </span>
          </div>

          {/* Subject line */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-muted-foreground w-16 shrink-0 text-[11px] font-medium tracking-wider uppercase">
              Subject:
            </span>
            <span className="text-foreground flex-1 truncate font-semibold" title={renderedSubject}>
              {renderedSubject || "(No subject)"}
            </span>
            {renderedSubject && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={copySubject}
                className="text-muted-foreground hover:text-foreground size-6 shrink-0"
                title="Copy subject line"
              >
                {copiedSubject ? (
                  <CheckIcon className="size-3 text-emerald-600" />
                ) : (
                  <CopyIcon className="size-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Email Body Frame: Responsive Simulated Canvas with Fluid Device Viewport */}
      <div
        className={`flex flex-1 items-start justify-center overflow-y-auto bg-neutral-100/90 p-3 transition-all sm:p-6 dark:bg-neutral-950/60 ${
          bodyMaxHeight || "max-h-[700px] min-h-[360px] sm:min-h-[480px]"
        }`}
      >
        {device === "mobile" ? (
          /* Mobile Frame Silhouette */
          <div className="w-full max-w-[375px] overflow-hidden rounded-[32px] border-4 border-neutral-800 bg-white shadow-2xl transition-all duration-300 dark:border-neutral-700">
            {/* Phone Speaker Notch */}
            <div className="mx-auto mb-1 flex h-4 w-28 items-center justify-center rounded-b-xl bg-neutral-800 dark:bg-neutral-700">
              <div className="mr-1.5 size-1 rounded-full bg-neutral-900/80" />
              <div className="h-1 w-8 rounded-full bg-neutral-900/60" />
            </div>

            <div
              className="prose prose-sm dark:prose-invert max-w-none overflow-x-hidden p-3.5 text-neutral-900"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        ) : (
          /* Desktop Browser Viewport Frame */
          <div className="w-full max-w-[640px] overflow-hidden rounded-xl border border-neutral-200/90 bg-white shadow-sm transition-all duration-300 dark:border-neutral-800">
            {/* Browser Top Window Bar */}
            <div className="flex items-center gap-1.5 border-b border-neutral-200 bg-neutral-100 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800/80">
              <div className="size-2.5 rounded-full bg-rose-400" />
              <div className="size-2.5 rounded-full bg-amber-400" />
              <div className="size-2.5 rounded-full bg-emerald-400" />
              <div className="ml-2 flex-1 truncate rounded bg-white px-2 py-0.5 font-mono text-[10px] text-neutral-500 dark:bg-neutral-900">
                email://client.preview/message
              </div>
            </div>

            <div
              className="prose prose-sm dark:prose-invert max-w-none overflow-x-hidden p-5 text-neutral-900 sm:p-7"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
