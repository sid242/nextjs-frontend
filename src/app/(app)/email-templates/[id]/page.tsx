"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  CopyIcon,
  EditIcon,
  FileTextIcon,
  LayersIcon,
  MailIcon,
  SendIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  CATEGORY_LABELS,
  DevicePreview,
  STATUS_COLORS,
  TestSendDialog,
  useDeleteEmailTemplate,
  useEmailTemplate,
} from "@/features/email-templates";
import { formatDate } from "@/lib/format";

export default function EmailTemplateDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [testSendOpen, setTestSendOpen] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  const { data: template, isLoading, isError } = useEmailTemplate(id);
  const deleteMutation = useDeleteEmailTemplate();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3">
        <Spinner className="text-primary size-7" />
        <span className="text-muted-foreground text-sm font-medium">
          Loading email template details...
        </span>
      </div>
    );
  }

  if (isError || !template) {
    return (
      <div className="border-border/80 bg-card mx-auto flex max-w-lg flex-col items-center justify-center space-y-4 rounded-2xl border p-8 text-center shadow-xs sm:p-12">
        <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-xl">
          <Trash2Icon className="size-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-foreground text-lg font-bold tracking-tight">Template Not Found</h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            The requested email template does not exist, has been removed, or you lack access to
            view it.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="gap-2 shadow-2xs">
          <Link href="/email-templates">
            <ArrowLeftIcon className="size-4" />
            <span>Return to Templates</span>
          </Link>
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to permanently delete template "${template?.name}"?`)) {
      try {
        await deleteMutation.mutateAsync(template.id);
        toast.success(`Template "${template.name}" deleted`);
        router.push("/email-templates");
      } catch {
        toast.error("Failed to delete template");
      }
    }
  };

  const copySlug = async () => {
    if (template?.slug) {
      await navigator.clipboard.writeText(template.slug);
      setCopiedSlug(true);
      toast.success(`Slug "/${template.slug}" copied to clipboard`);
      setTimeout(() => setCopiedSlug(false), 2000);
    }
  };

  const copyVariable = async (variable: string) => {
    const token = `{{${variable}}}`;
    await navigator.clipboard.writeText(token);
    setCopiedVariable(variable);
    toast.success(`Copied ${token} to clipboard`);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  const statusStyle = STATUS_COLORS[template?.status] ??
    STATUS_COLORS.DRAFT ?? {
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-border",
    };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Trail */}
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground flex items-center gap-1.5 text-xs"
      >
        <Link
          href="/email-templates"
          className="hover:text-foreground flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowLeftIcon className="size-3.5" />
          <span>Email Templates</span>
        </Link>
        <span className="text-border">/</span>
        <span className="text-foreground max-w-[200px] truncate font-semibold sm:max-w-none">
          {template?.name}
        </span>
      </nav>

      {/* Top Header Card: BrixUI Elevated Action Surface */}
      <div className="border-border/80 bg-card rounded-2xl border p-4 shadow-xs transition-all sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          {/* Title & Metadata Left Column */}
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
              <MailIcon className="size-5" />
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-foreground truncate text-xl font-bold tracking-tight sm:text-2xl">
                  {template?.name}
                </h1>

                {/* Status Badge with Live Indicator */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      template?.status === "PUBLISHED"
                        ? "animate-pulse bg-emerald-500"
                        : template?.status === "DRAFT"
                          ? "bg-amber-500"
                          : "bg-neutral-400"
                    }`}
                  />
                  <span>{template?.status}</span>
                </span>

                {/* Category Pill */}
                <Badge variant="outline" className="border-border/60 text-xs font-normal">
                  {CATEGORY_LABELS[template?.category] || template?.category}
                </Badge>
              </div>

              {/* Copyable Template Slug & Identifier */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={copySlug}
                  className="hover:border-border text-muted-foreground hover:text-foreground group bg-muted/40 inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-0.5 font-mono text-[11px] transition-all"
                  title="Click to copy slug"
                >
                  <span>/{template?.slug}</span>
                  {copiedSlug ? (
                    <CheckIcon className="size-3 text-emerald-600" />
                  ) : (
                    <CopyIcon className="size-3 opacity-60 group-hover:opacity-100" />
                  )}
                </button>
                <span className="text-muted-foreground/60 hidden sm:inline">•</span>
                <span className="text-muted-foreground hidden text-[11px] sm:inline">
                  Last updated {formatDate(template?.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar: Responsive Stacking */}
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestSendOpen(true)}
              className="hover:border-primary/50 flex-1 gap-1.5 text-xs font-medium shadow-2xs sm:flex-initial"
            >
              <SendIcon className="text-primary size-3.5" />
              <span>Test Send</span>
            </Button>

            <Button
              size="sm"
              asChild
              className="flex-1 gap-1.5 text-xs font-semibold shadow-xs sm:flex-initial"
            >
              <Link href={`/email-templates/${template?.id}/edit`}>
                <EditIcon className="size-3.5" />
                <span>Edit in Studio</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-8 shrink-0 transition-colors"
              title="Delete Template"
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: Responsive 2-Column Split (XL: 4 cols / 8 cols) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Column: Metadata & Variables (Stacked on mobile, 2-col on tablet, sidebar on XL) */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
          {/* Card 1: Template Overview */}
          <div className="border-border/80 bg-card rounded-2xl border p-5 shadow-xs transition-all sm:p-6">
            <div className="border-border/60 flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileTextIcon className="text-primary size-4" />
                <h2 className="text-foreground text-xs font-bold tracking-wider uppercase">
                  Template Overview
                </h2>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {template?.designJson ? "Visual Builder" : "Raw HTML"}
              </Badge>
            </div>

            <div className="divide-border/50 mt-3.5 divide-y text-xs">
              <div className="py-2.5 first:pt-0">
                <span className="text-muted-foreground block text-[11px] font-semibold tracking-wider uppercase">
                  Subject Line
                </span>
                <p className="text-foreground mt-1 leading-relaxed font-semibold">
                  {template?.subject}
                </p>
              </div>

              {(template?.senderName || template?.fromEmail) && (
                <div className="py-2.5">
                  <span className="text-muted-foreground block text-[11px] font-semibold tracking-wider uppercase">
                    From Address
                  </span>
                  <p className="text-foreground mt-1 font-medium">
                    {template?.senderName ? `${template.senderName} ` : ""}
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {template?.fromEmail ? `<${template.fromEmail}>` : "(Workspace Default)"}
                    </span>
                  </p>
                </div>
              )}

              {template?.replyTo && (
                <div className="py-2.5">
                  <span className="text-muted-foreground block text-[11px] font-semibold tracking-wider uppercase">
                    Reply-To
                  </span>
                  <p className="text-foreground mt-1 font-mono text-xs">{template.replyTo}</p>
                </div>
              )}

              {template?.description && (
                <div className="py-2.5">
                  <span className="text-muted-foreground block text-[11px] font-semibold tracking-wider uppercase">
                    Description
                  </span>
                  <p className="text-foreground/80 mt-1 text-xs leading-relaxed">
                    {template.description}
                  </p>
                </div>
              )}

              <div className="py-2.5">
                <span className="text-muted-foreground block text-[11px] font-semibold tracking-wider uppercase">
                  Authoring Mode
                </span>
                <div className="text-foreground mt-1 flex items-center gap-1.5 font-medium">
                  <LayersIcon className="text-muted-foreground size-3.5" />
                  <span>
                    {template?.designJson
                      ? "Visual Drag & Drop (Unlayer Studio)"
                      : "Direct HTML / Liquid Syntax"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2.5 last:pb-0">
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <CalendarIcon className="size-3.5" />
                  <span className="text-[11px] font-semibold tracking-wider uppercase">
                    Last Updated
                  </span>
                </div>
                <span className="text-foreground font-semibold">
                  {formatDate(template?.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Interactive Merge Variables */}
          <div className="border-border/80 bg-card rounded-2xl border p-5 shadow-xs transition-all sm:p-6">
            <div className="border-border/60 flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <TagIcon className="text-primary size-4" />
                <h2 className="text-foreground text-xs font-bold tracking-wider uppercase">
                  Merge Variables
                </h2>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                {template?.variables?.length ?? 0} Detected
              </Badge>
            </div>

            <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
              Click any token below to copy its liquid interpolation tag to your clipboard:
            </p>

            <div className="mt-3.5 flex flex-wrap gap-2">
              {template?.variables && template.variables.length > 0 ? (
                template.variables.map((v) => {
                  const isCopied = copiedVariable === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => copyVariable(v)}
                      className={`group inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-medium transition-all ${
                        isCopied
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-border/80 bg-muted/40 hover:border-primary/50 hover:bg-primary/5 text-foreground"
                      }`}
                      title={`Click to copy {{${v}}}`}
                    >
                      <span>{`{{${v}}}`}</span>
                      {isCopied ? (
                        <CheckIcon className="size-3 text-emerald-600" />
                      ) : (
                        <CopyIcon className="text-muted-foreground group-hover:text-primary size-3 transition-colors" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="text-muted-foreground border-border/80 rounded-lg border border-dashed p-4 text-center text-xs">
                  No dynamic merge variables detected in this template.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Upgraded Interactive Device Preview */}
        <div className="xl:col-span-8">
          <DevicePreview
            htmlContent={template?.htmlContent}
            subject={template?.subject}
            senderName={template?.senderName ?? undefined}
            fromEmail={template?.fromEmail ?? undefined}
            replyTo={template?.replyTo ?? undefined}
            bodyMaxHeight="min-h-[380px] sm:min-h-[500px] max-h-[750px]"
          />
        </div>
      </div>

      {/* Test Send Dialog */}
      <TestSendDialog template={template} open={testSendOpen} onOpenChange={setTestSendOpen} />
    </div>
  );
}
