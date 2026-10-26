"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CodeIcon,
  EyeIcon,
  FileCodeIcon,
  LayoutTemplateIcon,
  SaveIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { EditorRef } from "react-email-editor";

import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DEFAULT_STARTER_HTML } from "../constants";
import { useCreateEmailTemplate, useUpdateEmailTemplate } from "../queries";
import type {
  CreateEmailTemplateInput,
  EmailTemplate,
  EmailTemplateCategory,
  EmailTemplateStatus,
} from "../types";
import { DevicePreview } from "./device-preview";
import { VariableHelper } from "./variable-helper";

// Dynamically import Monaco Editor without SSR
const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="bg-muted/20 flex h-[480px] w-full items-center justify-center">
      <Spinner className="text-primary size-6" />
      <span className="text-muted-foreground ml-2 text-xs">Loading Monaco Code Editor...</span>
    </div>
  ),
});

// Dynamically import Unlayer React Email Editor without SSR
const EmailEditor = dynamic(() => import("react-email-editor").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="bg-muted/20 flex h-[580px] w-full items-center justify-center">
      <Spinner className="text-primary size-6" />
      <span className="text-muted-foreground ml-2 text-xs">Loading Visual Email Builder...</span>
    </div>
  ),
});

interface UnlayerExportData {
  html: string;
  design: Record<string, unknown>;
}

export interface TemplateStudioProps {
  initialTemplate?: EmailTemplate | null;
}

export function TemplateStudio({ initialTemplate }: TemplateStudioProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const isEditing = Boolean(initialTemplate?.id);

  // Editor mode: Monaco Code vs Visual Builder
  const [editorMode, setEditorMode] = useState<"code" | "visual">(() =>
    initialTemplate?.designJson ? "visual" : "code",
  );

  // Mobile viewport tab: Editor vs Preview
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  // Form states
  const [name, setName] = useState<string>(() => initialTemplate?.name ?? "");
  const [slug, setSlug] = useState<string>(() => initialTemplate?.slug ?? "");
  const [subject, setSubject] = useState<string>(() => initialTemplate?.subject ?? "");
  const [category, setCategory] = useState<EmailTemplateCategory>(
    () => initialTemplate?.category ?? "CUSTOM",
  );
  const [status, setStatus] = useState<EmailTemplateStatus>(
    () => initialTemplate?.status ?? "DRAFT",
  );
  const [description, setDescription] = useState<string>(() => initialTemplate?.description ?? "");
  const [senderName, setSenderName] = useState<string>(() => initialTemplate?.senderName ?? "");
  const [fromEmail, setFromEmail] = useState<string>(() => initialTemplate?.fromEmail ?? "");
  const [replyTo, setReplyTo] = useState<string>(() => initialTemplate?.replyTo ?? "");
  const [htmlContent, setHtmlContent] = useState<string>(
    () => initialTemplate?.htmlContent ?? DEFAULT_STARTER_HTML,
  );

  const emailEditorRef = useRef<EditorRef | null>(null);

  const createMutation = useCreateEmailTemplate({
    onSuccess: () => {
      router.push("/email-templates");
    },
  });

  const updateMutation = useUpdateEmailTemplate({
    onSuccess: () => {
      router.push("/email-templates");
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generatedSlug);
    }
  };

  const handleInsertVariable = (variableKey: string) => {
    const mergeTag = `{{${variableKey}}}`;
    setHtmlContent((prev) => prev + mergeTag);
  };

  const handleVisualEditorReady = () => {
    if (initialTemplate?.designJson && emailEditorRef?.current?.editor) {
      emailEditorRef.current.editor.loadDesign(
        initialTemplate.designJson as unknown as Parameters<
          NonNullable<EditorRef["editor"]>["loadDesign"]
        >[0],
      );
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) return;

    if (editorMode === "visual" && emailEditorRef?.current?.editor) {
      emailEditorRef.current.editor.exportHtml(async (data: UnlayerExportData) => {
        const payload: CreateEmailTemplateInput = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          subject: subject.trim(),
          category,
          status,
          description: description.trim() || undefined,
          senderName: senderName.trim() || undefined,
          fromEmail: fromEmail.trim() || undefined,
          replyTo: replyTo.trim() || undefined,
          htmlContent: data?.html ?? htmlContent,
          designJson: data?.design ?? undefined,
        };

        if (isEditing && initialTemplate?.id) {
          await updateMutation.mutateAsync({ id: initialTemplate.id, data: payload });
        } else {
          await createMutation.mutateAsync(payload);
        }
      });
    } else {
      const payload: CreateEmailTemplateInput = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        subject: subject.trim(),
        category,
        status,
        description: description.trim() || undefined,
        senderName: senderName.trim() || undefined,
        fromEmail: fromEmail.trim() || undefined,
        replyTo: replyTo.trim() || undefined,
        htmlContent,
        designJson: undefined,
      };

      if (isEditing && initialTemplate?.id) {
        await updateMutation.mutateAsync({ id: initialTemplate.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    }
  };

  const mergeTagCount = useMemo(() => {
    return htmlContent?.match(/\{\{([a-zA-Z0-9_]+)\}\}/g)?.length ?? 0;
  }, [htmlContent]);

  return (
    <form onSubmit={handleSubmit} className="flex min-h-[calc(100vh-8rem)] flex-col space-y-4">
      {/* Top Header & Sticky Navigation Bar */}
      <div className="border-border bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky top-0 z-20 flex flex-col justify-between gap-3 rounded-lg border p-3 shadow-xs backdrop-blur-md sm:flex-row sm:items-center sm:px-4 sm:py-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            asChild
            title="Back to Templates"
          >
            <Link href="/email-templates">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-base font-semibold tracking-tight sm:text-lg">
                {isEditing ? `Edit: ${initialTemplate?.name}` : "Create Email Template"}
              </h1>
              <span className="bg-primary/10 text-primary border-primary/20 hidden rounded-full border px-2 py-0.5 text-[11px] font-medium sm:inline-block">
                Studio
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              {isEditing
                ? `Updating template identifier /${initialTemplate?.slug ?? ""}`
                : "Author responsive marketing & transactional templates with live preview"}
            </p>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Editor Mode Switcher */}
          <div className="border-border bg-muted/40 flex items-center rounded-lg border p-0.5">
            <Button
              type="button"
              variant={editorMode === "code" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setEditorMode("code")}
              className="h-7 gap-1 px-2.5 text-xs font-medium"
            >
              <CodeIcon className="size-3.5" />
              <span className="hidden sm:inline">Monaco Code</span>
              <span className="sm:hidden">Code</span>
            </Button>
            <Button
              type="button"
              variant={editorMode === "visual" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setEditorMode("visual")}
              className="h-7 gap-1 px-2.5 text-xs font-medium"
            >
              <LayoutTemplateIcon className="size-3.5" />
              <span className="hidden sm:inline">Visual Builder</span>
              <span className="sm:hidden">Visual</span>
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => router.push("/email-templates")}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={isSaving || !name.trim() || !subject.trim()}
            className="h-8 gap-1.5 px-3 text-xs shadow-sm"
          >
            {isSaving ? (
              <>
                <Spinner className="size-3.5" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <SaveIcon className="size-3.5" />
                <span>{isEditing ? "Save Changes" : "Create Template"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Metadata Configuration Section (Fully Responsive Grid) */}
      <div className="border-border bg-card rounded-lg border p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          {/* Template Name */}
          <div className="space-y-1 sm:col-span-1 lg:col-span-4">
            <Label htmlFor="studio-name" className="text-xs font-medium">
              Template Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="studio-name"
              required
              placeholder="e.g. Project Welcome Brochure"
              className="h-8.5 text-xs"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          {/* Slug */}
          <div className="space-y-1 sm:col-span-1 lg:col-span-3">
            <Label htmlFor="studio-slug" className="text-xs font-medium">
              Slug (Unique ID)
            </Label>
            <Input
              id="studio-slug"
              placeholder="project-welcome-brochure"
              className="h-8.5 font-mono text-xs"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          {/* Subject Line */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-5">
            <Label htmlFor="studio-subject" className="text-xs font-medium">
              Email Subject Line <span className="text-destructive">*</span>
            </Label>
            <Input
              id="studio-subject"
              required
              placeholder="e.g. Welcome to {{project_name}} — Exclusive Details Inside"
              className="h-8.5 text-xs"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Sender Name, From Email, Reply-To Row */}
          <div className="space-y-1 sm:col-span-1 lg:col-span-4">
            <Label htmlFor="studio-sender-name" className="text-xs font-medium">
              Sender Name
            </Label>
            <Input
              id="studio-sender-name"
              placeholder="e.g. Savitara Support"
              className="h-8.5 text-xs"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </div>

          <div className="space-y-1 sm:col-span-1 lg:col-span-4">
            <Label htmlFor="studio-from-email" className="text-xs font-medium">
              From Email
            </Label>
            <Input
              id="studio-from-email"
              type="email"
              placeholder="e.g. alerts@savitara.com"
              className="h-8.5 font-mono text-xs"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1 sm:col-span-2 lg:col-span-4">
            <Label htmlFor="studio-reply-to" className="text-xs font-medium">
              Reply-To
            </Label>
            <Input
              id="studio-reply-to"
              type="email"
              placeholder="e.g. billing@savitara.com"
              className="h-8.5 font-mono text-xs"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-1 sm:col-span-1 lg:col-span-3">
            <Label className="text-xs font-medium">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as EmailTemplateCategory)}>
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MARKETING">Marketing Campaign</SelectItem>
                <SelectItem value="TRANSACTIONAL">Transactional</SelectItem>
                <SelectItem value="NOTIFICATION">Notification Alert</SelectItem>
                <SelectItem value="CUSTOM">Custom SMT/CRM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1 sm:col-span-1 lg:col-span-3">
            <Label className="text-xs font-medium">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as EmailTemplateStatus)}>
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-6">
            <Label htmlFor="studio-desc" className="text-xs font-medium">
              Internal Notes / Description
            </Label>
            <Input
              id="studio-desc"
              placeholder="Usage notes, target segment or automation trigger info..."
              className="text-muted-foreground placeholder:text-muted-foreground/60 h-8.5 text-xs"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Segmented Switcher (Visible on < lg screens) */}
      <div className="lg:hidden">
        <Tabs
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as "editor" | "preview")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor" className="gap-1.5 text-xs">
              <FileCodeIcon className="size-3.5" />
              <span>Editor Workspace</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5 text-xs">
              <EyeIcon className="size-3.5" />
              <span>Live Preview</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Workspace Area (Responsive: Stack on mobile, split-screen on desktop) */}
      <div className="flex-1">
        {/* Desktop View: Side-by-Side (7 cols editor, 5 cols preview) */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4">
          {/* Left Column: Variable Helper + Editor (Code or Visual) */}
          <div
            className={`flex flex-col space-y-3 ${
              editorMode === "code" ? "lg:col-span-7" : "lg:col-span-12"
            }`}
          >
            <VariableHelper onInsert={handleInsertVariable} />

            {editorMode === "code" ? (
              <div className="border-border bg-card flex flex-col overflow-hidden rounded-lg border shadow-xs">
                <div className="border-border bg-muted/40 flex items-center justify-between border-b px-3 py-2 text-xs">
                  <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <CodeIcon className="text-primary size-3.5" />
                    <span>HTML &amp; Liquid Template Source</span>
                  </div>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {htmlContent.length} chars • {mergeTagCount} variables
                  </span>
                </div>
                <div className="h-[620px] w-full">
                  <MonacoEditor
                    height="100%"
                    language="html"
                    theme={resolvedTheme === "dark" ? "vs-dark" : "vs-light"}
                    value={htmlContent}
                    onChange={(val) => setHtmlContent(val ?? "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: "on",
                      wordWrap: "on",
                      formatOnPaste: true,
                      automaticLayout: true,
                      tabSize: 2,
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Visual Builder in 12-col full width */
              <div className="border-border bg-card flex flex-col overflow-hidden rounded-lg border shadow-xs">
                <div className="border-border bg-muted/40 flex items-center justify-between border-b px-3 py-2 text-xs">
                  <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <LayoutTemplateIcon className="text-primary size-3.5" />
                    <span>Unlayer Drag &amp; Drop Visual Builder</span>
                  </div>
                  <span className="text-muted-foreground text-[11px]">
                    Drag components from right drawer into email canvas
                  </span>
                </div>
                <div className="h-[750px] w-full">
                  <EmailEditor
                    ref={emailEditorRef}
                    onReady={handleVisualEditorReady}
                    minHeight="750px"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Interactive Device Preview (only in code mode on desktop) */}
          {editorMode === "code" && (
            <div className="lg:col-span-5">
              <div className="sticky top-20">
                <DevicePreview
                  htmlContent={htmlContent}
                  subject={subject}
                  senderName={senderName}
                  fromEmail={fromEmail}
                  replyTo={replyTo}
                  bodyMaxHeight="min-h-[580px] max-h-[640px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile / Tablet View: Tab-based full width */}
        <div className="block lg:hidden">
          {mobileTab === "editor" ? (
            <div className="flex flex-col space-y-3">
              <VariableHelper onInsert={handleInsertVariable} />

              {editorMode === "code" ? (
                <div className="border-border bg-card flex flex-col overflow-hidden rounded-lg border shadow-xs">
                  <div className="border-border bg-muted/40 flex items-center justify-between border-b px-3 py-2 text-xs">
                    <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <CodeIcon className="text-primary size-3.5" />
                      <span>HTML Source</span>
                    </div>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {htmlContent.length} chars
                    </span>
                  </div>
                  <div className="h-[480px] w-full">
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
              ) : (
                <div className="border-border bg-card flex flex-col overflow-hidden rounded-lg border shadow-xs">
                  <div className="h-[600px] w-full">
                    <EmailEditor
                      ref={emailEditorRef}
                      onReady={handleVisualEditorReady}
                      minHeight="600px"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full">
              <DevicePreview
                htmlContent={htmlContent}
                subject={subject}
                senderName={senderName}
                fromEmail={fromEmail}
                replyTo={replyTo}
                bodyMaxHeight="min-h-[450px]"
              />
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
