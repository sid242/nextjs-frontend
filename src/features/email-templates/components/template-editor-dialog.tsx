"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CodeIcon, LayoutTemplateIcon, SaveIcon } from "lucide-react";
import { useTheme } from "next-themes";
import type { EditorRef } from "react-email-editor";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

import { CATEGORY_SELECT_OPTIONS, STATUS_SELECT_OPTIONS } from "../constants";
import { useCreateEmailTemplate, useUpdateEmailTemplate } from "../queries";
import type {
  CreateEmailTemplateInput,
  EmailTemplate,
  EmailTemplateCategory,
  EmailTemplateStatus,
} from "../types";
import { DevicePreview } from "./device-preview";
import { VariableHelper } from "./variable-helper";

// Dynamic import of Monaco Editor with SSR disabled
const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="bg-muted/20 flex h-[400px] w-full items-center justify-center">
      <Spinner className="text-primary size-6" />
      <span className="text-muted-foreground ml-2 text-xs">Loading Monaco Code Editor...</span>
    </div>
  ),
});

// Dynamic import of Unlayer React Email Editor with SSR disabled
const EmailEditor = dynamic(() => import("react-email-editor").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="bg-muted/20 flex h-[500px] w-full items-center justify-center">
      <Spinner className="text-primary size-6" />
      <span className="text-muted-foreground ml-2 text-xs">Loading Visual Email Builder...</span>
    </div>
  ),
});

interface TemplateEditorDialogProps {
  template: EmailTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_STARTER_HTML = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
  <!-- Header -->
  <div style="background-color: #0f172a; padding: 24px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;">{{org_name}}</h1>
    <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 14px;">Exclusive Property Update</p>
  </div>

  <!-- Body -->
  <div style="padding: 24px;">
    <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Hello {{customer_name}},</h2>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Thank you for your interest in <strong>{{project_name}}</strong> located at {{project_location}}.
    </p>

    <!-- Key Info Box -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <h3 style="color: #0f172a; font-size: 14px; margin-top: 0; margin-bottom: 12px; font-weight: bold;">Property Details</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 40%;">Property Type:</td>
          <td style="padding: 6px 0;">{{property_type}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold;">Possession:</td>
          <td style="padding: 6px 0;">{{possession_date}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold;">Unit Assigned:</td>
          <td style="padding: 6px 0;">{{unit_number}}</td>
        </tr>
      </table>
    </div>

    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Your dedicated property advisor is <strong>{{sales_member_name}}</strong>. Feel free to contact at {{sales_member_phone}} or {{sales_member_email}}.
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 28px 0;">
      <a href="https://savitara.com" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
        View Brochure & Floor Plans
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
    <p style="margin: 0;">{{org_name}} • Phone: {{org_phone}} • Email: {{org_email}}</p>
    <p style="margin: 4px 0 0 0;">This email was sent to {{customer_email}}.</p>
  </div>
</div>`;

interface UnlayerExportData {
  html: string;
  design: Record<string, unknown>;
}

function TemplateEditorDialogContent({
  template,
  onOpenChange,
}: {
  template: EmailTemplate | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { resolvedTheme } = useTheme();
  const [editorMode, setEditorMode] = useState<"code" | "visual">(
    template?.designJson ? "visual" : "code",
  );

  const [name, setName] = useState(template?.name ?? "");
  const [slug, setSlug] = useState(template?.slug ?? "");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [category, setCategory] = useState<EmailTemplateCategory>(template?.category ?? "CUSTOM");
  const [status, setStatus] = useState<EmailTemplateStatus>(template?.status ?? "DRAFT");
  const [description, setDescription] = useState(template?.description ?? "");
  const [senderName, setSenderName] = useState(template?.senderName ?? "");
  const [fromEmail, setFromEmail] = useState(template?.fromEmail ?? "");
  const [replyTo, setReplyTo] = useState(template?.replyTo ?? "");
  const [htmlContent, setHtmlContent] = useState(template?.htmlContent ?? DEFAULT_STARTER_HTML);

  const emailEditorRef = useRef<EditorRef | null>(null);

  const createMutation = useCreateEmailTemplate({
    onSuccess: () => onOpenChange(false),
  });

  const updateMutation = useUpdateEmailTemplate({
    onSuccess: () => onOpenChange(false),
  });

  const isEditing = Boolean(template);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleNameChange = (val: string) => {
    setName(val);
    if (
      !isEditing &&
      (!slug ||
        slug ===
          name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""))
    ) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      );
    }
  };

  const handleInsertVariable = (variableKey: string) => {
    const mergeTag = `{{${variableKey}}}`;
    setHtmlContent((prev) => prev + mergeTag);
  };

  const handleVisualEditorReady = () => {
    if (template?.designJson && emailEditorRef.current?.editor) {
      emailEditorRef.current.editor.loadDesign(
        template.designJson as unknown as Parameters<
          NonNullable<EditorRef["editor"]>["loadDesign"]
        >[0],
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject) return;

    if (editorMode === "visual" && emailEditorRef.current?.editor) {
      emailEditorRef.current.editor.exportHtml(async (data: UnlayerExportData) => {
        const payload: CreateEmailTemplateInput = {
          name,
          slug: slug || undefined,
          subject,
          category,
          status,
          description: description || undefined,
          senderName: senderName || undefined,
          fromEmail: fromEmail || undefined,
          replyTo: replyTo || undefined,
          htmlContent: data.html,
          designJson: data.design,
        };

        if (isEditing && template) {
          await updateMutation.mutateAsync({ id: template.id, data: payload });
        } else {
          await createMutation.mutateAsync(payload);
        }
      });
    } else {
      const payload: CreateEmailTemplateInput = {
        name,
        slug: slug || undefined,
        subject,
        category,
        status,
        description: description || undefined,
        senderName: senderName || undefined,
        fromEmail: fromEmail || undefined,
        replyTo: replyTo || undefined,
        htmlContent,
        designJson: undefined,
      };

      if (isEditing && template) {
        await updateMutation.mutateAsync({ id: template.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    }
  };

  return (
    <DialogContent className="flex max-h-[94vh] max-w-7xl flex-col overflow-hidden p-0">
      <DialogHeader className="border-border bg-card border-b px-6 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <DialogTitle className="text-base font-semibold">
              {isEditing ? `Edit Template: ${template?.name}` : "Create Email Template"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Build with Monaco Code Editor or Visual Drag & Drop Builder with live responsive
              preview
            </DialogDescription>
          </div>

          {/* Mode Switcher */}
          <div className="border-border bg-muted/40 flex items-center rounded-lg border p-1">
            <Button
              type="button"
              variant={editorMode === "code" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setEditorMode("code")}
              className="h-7 gap-1.5 px-3 text-xs"
            >
              <CodeIcon className="size-3.5" />
              <span>Monaco Code</span>
            </Button>
            <Button
              type="button"
              variant={editorMode === "visual" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setEditorMode("visual")}
              className="h-7 gap-1.5 px-3 text-xs"
            >
              <LayoutTemplateIcon className="size-3.5" />
              <span>Visual Drag & Drop</span>
            </Button>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        {/* Top Metadata Row */}
        <div className="border-border bg-muted/10 border-b px-6 py-3">
          <div className="grid grid-cols-12 items-center gap-3">
            <div className="col-span-3 space-y-1">
              <Label htmlFor="tpl-name" className="text-xs">
                Template Name *
              </Label>
              <Input
                id="tpl-name"
                required
                className="h-8 text-xs"
                placeholder="e.g. Welcome Brochure"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="tpl-slug" className="text-xs">
                Slug (Identifier)
              </Label>
              <Input
                id="tpl-slug"
                className="h-8 font-mono text-xs"
                placeholder="welcome-brochure"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="col-span-3 space-y-1">
              <Label htmlFor="tpl-subject" className="text-xs">
                Email Subject Line *
              </Label>
              <Input
                id="tpl-subject"
                required
                className="h-8 text-xs"
                placeholder="e.g. Welcome to {{project_name}}!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as EmailTemplateCategory)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_SELECT_OPTIONS?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as EmailTemplateStatus)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_SELECT_OPTIONS?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-12 gap-3">
            <div className="col-span-4 space-y-1">
              <Label htmlFor="tpl-sender-name" className="text-xs">
                Sender Name
              </Label>
              <Input
                id="tpl-sender-name"
                className="h-8 text-xs"
                placeholder="e.g. Savitara Support"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>
            <div className="col-span-4 space-y-1">
              <Label htmlFor="tpl-from-email" className="text-xs">
                From Email
              </Label>
              <Input
                id="tpl-from-email"
                type="email"
                className="h-8 font-mono text-xs"
                placeholder="e.g. alerts@savitara.com"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
              />
            </div>
            <div className="col-span-4 space-y-1">
              <Label htmlFor="tpl-reply-to" className="text-xs">
                Reply-To
              </Label>
              <Input
                id="tpl-reply-to"
                type="email"
                className="h-8 font-mono text-xs"
                placeholder="e.g. billing@savitara.com"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-2">
            <Input
              id="tpl-desc"
              className="text-muted-foreground placeholder:text-muted-foreground/60 h-7 text-xs"
              placeholder="Internal description or usage note (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Editor Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {editorMode === "code" ? (
            <div className="divide-border grid h-full grid-cols-12 divide-x">
              {/* Left Column: Variable helper + Monaco Editor */}
              <div className="col-span-7 flex h-full flex-col space-y-3 overflow-hidden p-4">
                <VariableHelper onInsert={handleInsertVariable} />

                <div className="border-border bg-background flex-1 overflow-hidden rounded-md border">
                  <MonacoEditor
                    height="100%"
                    language="html"
                    theme={resolvedTheme === "dark" ? "vs-dark" : "vs-light"}
                    value={htmlContent}
                    onChange={(val) => setHtmlContent(val ?? "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: "on",
                      wordWrap: "on",
                      formatOnPaste: true,
                      automaticLayout: true,
                      tabSize: 2,
                    }}
                  />
                </div>
              </div>

              {/* Right Column: Live Responsive Preview */}
              <div className="bg-muted/10 col-span-5 flex flex-col overflow-y-auto p-4">
                <DevicePreview
                  htmlContent={htmlContent}
                  subject={subject}
                  senderName={senderName}
                  fromEmail={fromEmail}
                  replyTo={replyTo}
                  className="flex-1"
                />
              </div>
            </div>
          ) : (
            /* Visual Builder Mode using Unlayer */
            <div className="flex h-full flex-col space-y-2 overflow-hidden p-4">
              <VariableHelper onInsert={handleInsertVariable} />
              <div className="border-border bg-background flex-1 overflow-hidden rounded-md border">
                <EmailEditor
                  ref={emailEditorRef}
                  onReady={handleVisualEditorReady}
                  minHeight="100%"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-border bg-muted/20 flex items-center justify-between border-t px-6 py-2.5">
          <div className="text-muted-foreground text-xs">
            Mode:{" "}
            <span className="font-semibold">
              {editorMode === "code" ? "Monaco Editor" : "Visual Builder"}
            </span>{" "}
            • {htmlContent.length} chars • Merge tags:{" "}
            {htmlContent.match(/\{\{([a-zA-Z0-9_]+)\}\}/g)?.length || 0}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || !name || !subject}
              className="gap-1.5"
            >
              {isSaving ? (
                <>
                  <Spinner className="size-3.5" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <SaveIcon className="size-3.5" />
                  <span>{isEditing ? "Update Template" : "Create Template"}</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function TemplateEditorDialog({ template, open, onOpenChange }: TemplateEditorDialogProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <TemplateEditorDialogContent
        key={template?.id ?? "new"}
        template={template}
        onOpenChange={onOpenChange}
      />
    </Dialog>
  );
}
