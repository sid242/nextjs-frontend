"use client";

import { useRef, useState, type FormEvent } from "react";
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
    <div className="bg-muted/20 flex h-100 w-full items-center justify-center">
      <Spinner className="text-primary size-6" />
      <span className="text-muted-foreground ml-2 text-xs">Loading Monaco Code Editor...</span>
    </div>
  ),
});

// Dynamic import of Unlayer React Email Editor with SSR disabled
const EmailEditor = dynamic(() => import("react-email-editor").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="bg-muted/20 flex h-125 w-full items-center justify-center">
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

interface TemplateFormState {
  editorMode: "code" | "visual";
  name: string;
  slug: string;
  subject: string;
  category: EmailTemplateCategory;
  status: EmailTemplateStatus;
  description: string;
  senderName: string;
  fromEmail: string;
  replyTo: string;
  htmlContent: string;
}

function TemplateEditorDialogContent({
  template,
  onOpenChange,
}: {
  template: EmailTemplate | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { resolvedTheme } = useTheme();

  const [formState, setFormState] = useState<TemplateFormState>({
    editorMode: template?.designJson ? "visual" : "code",
    name: template?.name ?? "",
    slug: template?.slug ?? "",
    subject: template?.subject ?? "",
    category: template?.category ?? "CUSTOM",
    status: template?.status ?? "DRAFT",
    description: template?.description ?? "",
    senderName: template?.senderName ?? "",
    fromEmail: template?.fromEmail ?? "",
    replyTo: template?.replyTo ?? "",
    htmlContent: template?.htmlContent ?? DEFAULT_STARTER_HTML,
  });

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
    setFormState((prev) => {
      const currentSlug = prev.slug;
      const autoSlug = prev.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const shouldUpdateSlug = !isEditing && (!currentSlug || currentSlug === autoSlug);
      return {
        ...prev,
        name: val,
        slug: shouldUpdateSlug
          ? val
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "")
          : prev.slug,
      };
    });
  };

  const handleInsertVariable = (variableKey: string) => {
    const mergeTag = `{{${variableKey}}}`;
    setFormState((prev) => ({
      ...prev,
      htmlContent: prev.htmlContent + mergeTag,
    }));
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.subject) return;

    if (formState.editorMode === "visual" && emailEditorRef.current?.editor) {
      emailEditorRef.current.editor.exportHtml(async (data: UnlayerExportData) => {
        const payload: CreateEmailTemplateInput = {
          name: formState.name,
          slug: formState.slug || undefined,
          subject: formState.subject,
          category: formState.category,
          status: formState.status,
          description: formState.description || undefined,
          senderName: formState.senderName || undefined,
          fromEmail: formState.fromEmail || undefined,
          replyTo: formState.replyTo || undefined,
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
        name: formState.name,
        slug: formState.slug || undefined,
        subject: formState.subject,
        category: formState.category,
        status: formState.status,
        description: formState.description || undefined,
        senderName: formState.senderName || undefined,
        fromEmail: formState.fromEmail || undefined,
        replyTo: formState.replyTo || undefined,
        htmlContent: formState.htmlContent,
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
    <DialogContent className="border-border/80 bg-background flex max-h-[94vh] max-w-7xl flex-col overflow-hidden rounded-2xl p-0 shadow-2xl">
      <DialogHeader className="border-border/80 bg-card/60 border-b px-6 py-3.5 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <div>
            <DialogTitle className="text-foreground text-base font-semibold">
              {isEditing ? `Edit Template: ${template?.name}` : "Create Email Template"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Build with Monaco Code Editor or Visual Drag & Drop Builder with live responsive
              preview
            </DialogDescription>
          </div>

          {/* Mode Switcher */}
          <div className="border-border/80 bg-muted/50 flex items-center rounded-xl border p-1 shadow-xs">
            <Button
              type="button"
              variant={formState.editorMode === "code" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFormState((prev) => ({ ...prev, editorMode: "code" }))}
              className="h-7.5 gap-1.5 rounded-lg px-3 text-xs"
            >
              <CodeIcon className="size-3.5" />
              <span>Monaco Code</span>
            </Button>
            <Button
              type="button"
              variant={formState.editorMode === "visual" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFormState((prev) => ({ ...prev, editorMode: "visual" }))}
              className="h-7.5 gap-1.5 rounded-lg px-3 text-xs"
            >
              <LayoutTemplateIcon className="size-3.5" />
              <span>Visual Drag & Drop</span>
            </Button>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        {/* Top Metadata Row */}
        <div className="border-border/80 bg-muted/15 border-b px-6 py-3.5">
          <div className="grid grid-cols-12 items-center gap-3">
            <div className="col-span-12 space-y-1 sm:col-span-3">
              <Label htmlFor="tpl-name" className="text-muted-foreground text-xs font-medium">
                Template Name *
              </Label>
              <Input
                id="tpl-name"
                required
                className="border-border/80 h-9 rounded-xl text-xs"
                placeholder="e.g. Welcome Brochure"
                value={formState.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="col-span-12 space-y-1 sm:col-span-2">
              <Label htmlFor="tpl-slug" className="text-muted-foreground text-xs font-medium">
                Slug (Identifier)
              </Label>
              <Input
                id="tpl-slug"
                className="border-border/80 h-9 rounded-xl font-mono text-xs"
                placeholder="welcome-brochure"
                value={formState.slug}
                onChange={(e) => setFormState((prev) => ({ ...prev, slug: e.target.value }))}
              />
            </div>
            <div className="col-span-12 space-y-1 sm:col-span-3">
              <Label htmlFor="tpl-subject" className="text-muted-foreground text-xs font-medium">
                Email Subject Line *
              </Label>
              <Input
                id="tpl-subject"
                required
                className="border-border/80 h-9 rounded-xl text-xs"
                placeholder="e.g. Welcome to {{project_name}}!"
                value={formState.subject}
                onChange={(e) => setFormState((prev) => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div className="col-span-12 space-y-1 sm:col-span-2">
              <Label className="text-muted-foreground text-xs font-medium">Category</Label>
              <Select
                value={formState.category}
                onValueChange={(v) =>
                  setFormState((prev) => ({ ...prev, category: v as EmailTemplateCategory }))
                }
              >
                <SelectTrigger className="border-border/80 h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="border-border/80 rounded-xl shadow-md">
                  {CATEGORY_SELECT_OPTIONS?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-12 space-y-1 sm:col-span-2">
              <Label className="text-muted-foreground text-xs font-medium">Status</Label>
              <Select
                value={formState.status}
                onValueChange={(v) =>
                  setFormState((prev) => ({ ...prev, status: v as EmailTemplateStatus }))
                }
              >
                <SelectTrigger className="border-border/80 h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border-border/80 rounded-xl shadow-md">
                  {STATUS_SELECT_OPTIONS?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-2.5 grid grid-cols-12 gap-3">
            <div className="col-span-12 space-y-1 sm:col-span-4">
              <Label
                htmlFor="tpl-sender-name"
                className="text-muted-foreground text-xs font-medium"
              >
                Sender Name
              </Label>
              <Input
                id="tpl-sender-name"
                className="border-border/80 h-9 rounded-xl text-xs"
                placeholder="e.g. Savitara Support"
                value={formState.senderName}
                onChange={(e) => setFormState((prev) => ({ ...prev, senderName: e.target.value }))}
              />
            </div>
            <div className="col-span-12 space-y-1 sm:col-span-4">
              <Label htmlFor="tpl-from-email" className="text-muted-foreground text-xs font-medium">
                From Email
              </Label>
              <Input
                id="tpl-from-email"
                type="email"
                className="border-border/80 h-9 rounded-xl font-mono text-xs"
                placeholder="e.g. alerts@savitara.com"
                value={formState.fromEmail}
                onChange={(e) => setFormState((prev) => ({ ...prev, fromEmail: e.target.value }))}
              />
            </div>
            <div className="col-span-12 space-y-1 sm:col-span-4">
              <Label htmlFor="tpl-reply-to" className="text-muted-foreground text-xs font-medium">
                Reply-To
              </Label>
              <Input
                id="tpl-reply-to"
                type="email"
                className="border-border/80 h-9 rounded-xl font-mono text-xs"
                placeholder="e.g. billing@savitara.com"
                value={formState.replyTo}
                onChange={(e) => setFormState((prev) => ({ ...prev, replyTo: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-2.5">
            <Input
              id="tpl-desc"
              className="text-muted-foreground placeholder:text-muted-foreground/60 border-border/80 h-8 rounded-xl text-xs"
              placeholder="Internal description or usage note (optional)..."
              value={formState.description}
              onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>

        {/* Editor Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {formState.editorMode === "code" ? (
            <div className="divide-border/80 grid h-full grid-cols-12 divide-x">
              {/* Left Column: Variable helper + Monaco Editor */}
              <div className="col-span-12 flex h-full flex-col space-y-3 overflow-hidden p-4 lg:col-span-7">
                <VariableHelper onInsert={handleInsertVariable} />

                <div className="border-border/80 bg-background flex-1 overflow-hidden rounded-xl border shadow-xs">
                  <MonacoEditor
                    height="100%"
                    language="html"
                    theme={resolvedTheme === "dark" ? "vs-dark" : "vs-light"}
                    value={formState.htmlContent}
                    onChange={(val) =>
                      setFormState((prev) => ({ ...prev, htmlContent: val ?? "" }))
                    }
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
              <div className="bg-muted/10 col-span-12 flex flex-col overflow-y-auto p-4 lg:col-span-5">
                <DevicePreview
                  htmlContent={formState.htmlContent}
                  subject={formState.subject}
                  senderName={formState.senderName}
                  fromEmail={formState.fromEmail}
                  replyTo={formState.replyTo}
                  className="flex-1"
                />
              </div>
            </div>
          ) : (
            /* Visual Builder Mode using Unlayer */
            <div className="flex h-full flex-col space-y-2 overflow-hidden p-4">
              <VariableHelper onInsert={handleInsertVariable} />
              <div className="border-border/80 bg-background flex-1 overflow-hidden rounded-xl border shadow-xs">
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
        <DialogFooter className="border-border/80 bg-muted/20 flex items-center justify-between border-t px-6 py-2.5">
          <div className="text-muted-foreground text-xs">
            Mode:{" "}
            <span className="text-foreground font-semibold">
              {formState.editorMode === "code" ? "Monaco Editor" : "Visual Builder"}
            </span>{" "}
            • {formState.htmlContent.length} chars • Merge tags:{" "}
            {formState.htmlContent.match(/\{\{([a-zA-Z0-9_]+)\}\}/g)?.length || 0}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="border-border/80 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || !formState.name || !formState.subject}
              className="gap-1.5 rounded-xl"
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
