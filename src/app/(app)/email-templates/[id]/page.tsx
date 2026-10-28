"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  EditIcon,
  SendIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react";

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

  const { data: template, isLoading, isError } = useEmailTemplate(id);
  const deleteMutation = useDeleteEmailTemplate();

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-3">
        <Spinner className="text-primary size-7" />
        <span className="text-muted-foreground text-sm">Loading template details...</span>
      </div>
    );
  }

  if (isError || !template) {
    return (
      <div className="border-border bg-card flex flex-col items-center justify-center space-y-4 rounded-lg border p-12 text-center">
        <div className="space-y-1">
          <h2 className="text-foreground text-base font-semibold">Template Not Found</h2>
          <p className="text-muted-foreground text-xs">
            The requested email template does not exist or has been removed.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <Link href="/email-templates">
            <ArrowLeftIcon className="size-3.5" />
            <span>Return to Templates</span>
          </Link>
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete email template "${template?.name}"?`)) {
      await deleteMutation.mutateAsync(template.id);
      router.push("/email-templates");
    }
  };

  const statusStyle = STATUS_COLORS[template?.status] ??
    STATUS_COLORS.DRAFT ?? {
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-border",
    };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-border bg-card flex flex-col justify-between gap-4 rounded-lg border p-4 shadow-xs sm:flex-row sm:items-center sm:px-6 sm:py-4">
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            asChild
            title="Back to Templates"
          >
            <Link href="/email-templates">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-foreground text-lg font-bold tracking-tight sm:text-xl">
                {template?.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                {template?.status === "PUBLISHED" && <CheckCircleIcon className="size-3" />}
                <span>{template?.status}</span>
              </span>
              <Badge variant="outline" className="text-[11px] font-normal">
                {CATEGORY_LABELS[template?.category] || template?.category}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 font-mono text-xs">ID: /{template?.slug}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTestSendOpen(true)}
            className="gap-1.5 text-xs"
          >
            <SendIcon className="text-primary size-3.5" />
            <span>Test Send</span>
          </Button>

          <Button size="sm" asChild className="gap-1.5 text-xs shadow-xs">
            <Link href={`/email-templates/${template?.id}/edit`}>
              <EditIcon className="size-3.5" />
              <span>Edit in Studio</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-destructive hover:bg-destructive/10 size-8"
            title="Delete Template"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Grid: Info Breakdown + Full Interactive Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Metadata & Variables Card */}
        <div className="space-y-4 lg:col-span-4">
          <div className="border-border bg-card rounded-lg border p-4 shadow-xs">
            <h2 className="text-foreground text-xs font-semibold tracking-wide uppercase">
              Template Overview
            </h2>

            <div className="border-border/60 mt-3 space-y-3 divide-y text-xs">
              <div className="pt-2">
                <span className="text-muted-foreground block text-[11px] font-medium">
                  Subject Line
                </span>
                <p className="text-foreground mt-0.5 font-medium">{template?.subject}</p>
              </div>

              {(template?.senderName || template?.fromEmail) && (
                <div className="pt-2.5">
                  <span className="text-muted-foreground block text-[11px] font-medium">
                    From Address
                  </span>
                  <p className="text-foreground mt-0.5 font-medium">
                    {template?.senderName ? `${template.senderName} ` : ""}
                    {template?.fromEmail ? `<${template.fromEmail}>` : "(Default Workspace Sender)"}
                  </p>
                </div>
              )}

              {template?.replyTo && (
                <div className="pt-2.5">
                  <span className="text-muted-foreground block text-[11px] font-medium">
                    Reply-To Address
                  </span>
                  <p className="text-foreground mt-0.5 font-mono text-xs">{template.replyTo}</p>
                </div>
              )}

              {template?.description && (
                <div className="pt-2.5">
                  <span className="text-muted-foreground block text-[11px] font-medium">
                    Internal Description
                  </span>
                  <p className="text-foreground/80 mt-0.5 leading-relaxed">
                    {template?.description}
                  </p>
                </div>
              )}

              <div className="pt-2.5">
                <span className="text-muted-foreground block text-[11px] font-medium">
                  Authoring Mode
                </span>
                <p className="text-foreground mt-0.5">
                  {template?.designJson
                    ? "Visual Drag & Drop (Unlayer)"
                    : "Direct HTML / Liquid Code"}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2.5">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="text-muted-foreground size-3.5" />
                  <span className="text-muted-foreground text-[11px]">Last Updated</span>
                </div>
                <span className="text-foreground font-medium">
                  {formatDate(template?.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Merge Variables Card */}
          <div className="border-border bg-card rounded-lg border p-4 shadow-xs">
            <div className="flex items-center gap-1.5">
              <TagIcon className="text-primary size-3.5" />
              <h2 className="text-foreground text-xs font-semibold tracking-wide uppercase">
                Detected Variables ({template?.variables?.length ?? 0})
              </h2>
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Dynamic fields automatically mapped during customer or lead email dispatch.
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {template?.variables && template?.variables?.length > 0 ? (
                template.variables.map((v) => (
                  <Badge
                    key={v}
                    variant="secondary"
                    className="border-border/60 font-mono text-[11px]"
                  >
                    {`{{${v}}}`}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-xs italic">
                  No merge variables detected in template.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Live Preview Frame */}
        <div className="lg:col-span-8">
          <DevicePreview
            htmlContent={template?.htmlContent}
            subject={template?.subject}
            senderName={template?.senderName ?? undefined}
            fromEmail={template?.fromEmail ?? undefined}
            replyTo={template?.replyTo ?? undefined}
            bodyMaxHeight="min-h-[550px] max-h-[700px]"
          />
        </div>
      </div>

      {/* Test Send Dialog */}
      <TestSendDialog template={template} open={testSendOpen} onOpenChange={setTestSendOpen} />
    </div>
  );
}
