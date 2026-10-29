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
import { generateSlug } from "@/lib/utils";

import { CATEGORY_SELECT_OPTIONS, DEFAULT_STARTER_HTML, STATUS_SELECT_OPTIONS } from "../constants";
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
    <div className="bg-muted/20 flex h-120 w-full items-center justify-center">
      <Spinner className="text-primary size-6" />
      <span className="text-muted-foreground ml-2 text-xs">Loading Monaco Code Editor...</span>
    </div>
  ),
});

// Dynamically import Unlayer React Email Editor without SSR
const EmailEditor = dynamic(() => import("react-email-editor").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="bg-muted/20 flex h-145 w-full items-center justify-center">
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

interface StudioState {
  editorMode: "code" | "visual";
  mobileTab: "editor" | "preview";
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

export function TemplateStudio({ initialTemplate }: TemplateStudioProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const isEditing = Boolean(initialTemplate?.id);

  const [studioState, setStudioState] = useState<StudioState>({
    editorMode: initialTemplate?.designJson ? "visual" : "code",
    mobileTab: "editor",
    name: initialTemplate?.name ?? "",
    slug: initialTemplate?.slug ?? "",
    subject: initialTemplate?.subject ?? "",
    category: initialTemplate?.category ?? "CUSTOM",
    status: initialTemplate?.status ?? "DRAFT",
    description: initialTemplate?.description ?? "",
    senderName: initialTemplate?.senderName ?? "",
    fromEmail: initialTemplate?.fromEmail ?? "",
    replyTo: initialTemplate?.replyTo ?? "",
    htmlContent: initialTemplate?.htmlContent ?? DEFAULT_STARTER_HTML,
  });

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
    setStudioState((prev) => {
      const generatedSlug = !isEditing ? generateSlug(val) : prev.slug;
      return {
        ...prev,
        name: val,
        slug: generatedSlug,
      };
    });
  };

  const handleInsertVariable = (variableKey: string) => {
    const mergeTag = `{{${variableKey}}}`;
    setStudioState((prev) => ({
      ...prev,
      htmlContent: prev.htmlContent + mergeTag,
    }));
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
    if (!studioState.name.trim() || !studioState.subject.trim()) return;

    if (studioState.editorMode === "visual" && emailEditorRef?.current?.editor) {
      emailEditorRef.current.editor.exportHtml(async (data: UnlayerExportData) => {
        const payload: CreateEmailTemplateInput = {
          name: studioState.name.trim(),
          slug: studioState.slug.trim() || undefined,
          subject: studioState.subject.trim(),
          category: studioState.category,
          status: studioState.status,
          description: studioState.description.trim() || undefined,
          senderName: studioState.senderName.trim() || undefined,
          fromEmail: studioState.fromEmail.trim() || undefined,
          replyTo: studioState.replyTo.trim() || undefined,
          htmlContent: data?.html ?? studioState.htmlContent,
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
        name: studioState.name.trim(),
        slug: studioState.slug.trim() || undefined,
        subject: studioState.subject.trim(),
        category: studioState.category,
        status: studioState.status,
        description: studioState.description.trim() || undefined,
        senderName: studioState.senderName.trim() || undefined,
        fromEmail: studioState.fromEmail.trim() || undefined,
        replyTo: studioState.replyTo.trim() || undefined,
        htmlContent: studioState.htmlContent,
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
    return studioState.htmlContent.match(/\{\{([a-zA-Z0-9_]+)\}\}/g)?.length || 0;
  }, [studioState.htmlContent]);

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
          <div className="border-border/80 bg-muted/50 flex items-center rounded-xl border p-1 shadow-xs">
            <Button
              type="button"
              variant={studioState.editorMode === "code" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStudioState((prev) => ({ ...prev, editorMode: "code" }))}
              className="h-7.5 gap-1 rounded-lg px-2.5 text-xs font-medium"
            >
              <CodeIcon className="size-3.5" />
              <span className="hidden sm:inline">Monaco Code</span>
              <span className="sm:hidden">Code</span>
            </Button>
            <Button
              type="button"
              variant={studioState.editorMode === "visual" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStudioState((prev) => ({ ...prev, editorMode: "visual" }))}
              className="h-7.5 gap-1 rounded-lg px-2.5 text-xs font-medium"
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
            className="border-border/80 h-9 rounded-xl text-xs"
            onClick={() => router.push("/email-templates")}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={isSaving || !studioState.name.trim() || !studioState.subject.trim()}
            className="h-9 gap-1.5 rounded-xl px-3.5 text-xs shadow-xs"
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
      <div className="border-border/80 bg-card rounded-2xl border p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-12">
          {/* Template Name */}
          <div className="space-y-1 sm:col-span-1 lg:col-span-4">
            <Label htmlFor="studio-name" className="text-muted-foreground text-xs font-medium">
              Template Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="studio-name"
              required
              placeholder="e.g. Project Welcome Brochure"
              className="border-border/80 h-9 rounded-xl text-xs"
              value={studioState.name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          {/* Slug */}
          <div className="space-y-1 sm:col-span-1 lg:col-span-3">
            <Label htmlFor="studio-slug" className="text-muted-foreground text-xs font-medium">
              Slug (Unique ID)
            </Label>
            <Input
              id="studio-slug"
              placeholder="project-welcome-brochure"
              className="border-border/80 h-9 rounded-xl font-mono text-xs"
              value={studioState.slug}
              onChange={(e) => setStudioState((prev) => ({ ...prev, slug: e.target.value }))}
            />
          </div>

          {/* Subject Line */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-5">
            <Label htmlFor="studio-subject" className="text-muted-foreground text-xs font-medium">
              Email Subject Line <span className="text-destructive">*</span>
            </Label>
            <Input
              id="studio-subject"
              required
              placeholder="e.g. Welcome to {{project_name}} — Exclusive Details Inside"
              className="border-border/80 h-9 rounded-xl text-xs"
              value={studioState.subject}
              onChange={(e) => setStudioState((prev) => ({ ...prev, subject: e.target.value }))}
            />
          </div>

          {/* Sender Name, From Email, Reply-To Row */}
          <div className="space-y-1 sm:col-span-1 lg:col-span-4">
            <Label
              htmlFor="studio-sender-name"
              className="text-muted-foreground text-xs font-medium"
            >
              Sender Name
            </Label>
            <Input
              id="studio-sender-name"
              placeholder="e.g. Savitara Support"
              className="border-border/80 h-9 rounded-xl text-xs"
              value={studioState.senderName}
              onChange={(e) => setStudioState((prev) => ({ ...prev, senderName: e.target.value }))}
            />
          </div>

          <div className="space-y-1 sm:col-span-1 lg:col-span-4">
            <Label
              htmlFor="studio-from-email"
              className="text-muted-foreground text-xs font-medium"
            >
              From Email
            </Label>
            <Input
              id="studio-from-email"
              type="email"
              placeholder="e.g. alerts@savitara.com"
              className="border-border/80 h-9 rounded-xl font-mono text-xs"
              value={studioState.fromEmail}
              onChange={(e) => setStudioState((prev) => ({ ...prev, fromEmail: e.target.value }))}
            />
          </div>

          <div className="space-y-1 sm:col-span-2 lg:col-span-4">
            <Label htmlFor="studio-reply-to" className="text-muted-foreground text-xs font-medium">
              Reply-To
            </Label>
            <Input
              id="studio-reply-to"
              type="email"
              placeholder="e.g. billing@savitara.com"
              className="border-border/80 h-9 rounded-xl font-mono text-xs"
              value={studioState.replyTo}
              onChange={(e) => setStudioState((prev) => ({ ...prev, replyTo: e.target.value }))}
            />
          </div>

          {/* Category */}
          <div className="space-y-1 sm:col-span-1 lg:col-span-3">
            <Label className="text-muted-foreground text-xs font-medium">Category</Label>
            <Select
              value={studioState.category}
              onValueChange={(v) =>
                setStudioState((prev) => ({ ...prev, category: v as EmailTemplateCategory }))
              }
            >
              <SelectTrigger className="border-border/80 h-9 rounded-xl text-xs">
                <SelectValue placeholder="Select Category" />
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

          {/* Status */}
          <div className="space-y-1 sm:col-span-1 lg:col-span-3">
            <Label className="text-muted-foreground text-xs font-medium">Status</Label>
            <Select
              value={studioState.status}
              onValueChange={(v) =>
                setStudioState((prev) => ({ ...prev, status: v as EmailTemplateStatus }))
              }
            >
              <SelectTrigger className="border-border/80 h-9 rounded-xl text-xs">
                <SelectValue placeholder="Select Status" />
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

          {/* Description */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-6">
            <Label htmlFor="studio-desc" className="text-muted-foreground text-xs font-medium">
              Internal Notes / Description
            </Label>
            <Input
              id="studio-desc"
              placeholder="Usage notes, target segment or automation trigger info..."
              className="text-muted-foreground placeholder:text-muted-foreground/60 border-border/80 h-9 rounded-xl text-xs"
              value={studioState.description}
              onChange={(e) => setStudioState((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Segmented Switcher (Visible on < lg screens) */}
      <div className="lg:hidden">
        <Tabs
          value={studioState.mobileTab}
          onValueChange={(v) =>
            setStudioState((prev) => ({ ...prev, mobileTab: v as "editor" | "preview" }))
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="editor" className="gap-1.5 rounded-lg text-xs">
              <FileCodeIcon className="size-3.5" />
              <span>Editor Workspace</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5 rounded-lg text-xs">
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
              studioState.editorMode === "code" ? "lg:col-span-7" : "lg:col-span-12"
            }`}
          >
            <VariableHelper onInsert={handleInsertVariable} />

            {studioState.editorMode === "code" ? (
              <div className="border-border/80 bg-card flex flex-col overflow-hidden rounded-2xl border shadow-xs">
                <div className="border-border/80 bg-muted/40 flex items-center justify-between border-b px-3.5 py-2.5 text-xs">
                  <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <CodeIcon className="text-primary size-3.5" />
                    <span>HTML &amp; Liquid Template Source</span>
                  </div>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {studioState.htmlContent.length} chars • {mergeTagCount} variables
                  </span>
                </div>
                <div className="h-155 w-full">
                  <MonacoEditor
                    height="100%"
                    language="html"
                    theme={resolvedTheme === "dark" ? "vs-dark" : "vs-light"}
                    value={studioState.htmlContent}
                    onChange={(val) =>
                      setStudioState((prev) => ({ ...prev, htmlContent: val ?? "" }))
                    }
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
              <div className="border-border/80 bg-card flex flex-col overflow-hidden rounded-2xl border shadow-xs">
                <div className="border-border/80 bg-muted/40 flex items-center justify-between border-b px-3.5 py-2.5 text-xs">
                  <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <LayoutTemplateIcon className="text-primary size-3.5" />
                    <span>Unlayer Drag &amp; Drop Visual Builder</span>
                  </div>
                  <span className="text-muted-foreground text-[11px]">
                    Drag components from right drawer into email canvas
                  </span>
                </div>
                <div className="h-187.5 w-full">
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
          {studioState.editorMode === "code" && (
            <div className="lg:col-span-5">
              <div className="sticky top-20">
                <DevicePreview
                  htmlContent={studioState.htmlContent}
                  subject={studioState.subject}
                  senderName={studioState.senderName}
                  fromEmail={studioState.fromEmail}
                  replyTo={studioState.replyTo}
                  bodyMaxHeight="min-h-145 max-h-160"
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile / Tablet View: Tab-based full width */}
        <div className="block lg:hidden">
          {studioState.mobileTab === "editor" ? (
            <div className="flex flex-col space-y-3">
              <VariableHelper onInsert={handleInsertVariable} />

              {studioState.editorMode === "code" ? (
                <div className="border-border/80 bg-card flex flex-col overflow-hidden rounded-2xl border shadow-xs">
                  <div className="border-border/80 bg-muted/40 flex items-center justify-between border-b px-3.5 py-2.5 text-xs">
                    <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <CodeIcon className="text-primary size-3.5" />
                      <span>HTML Source</span>
                    </div>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {studioState.htmlContent.length} chars
                    </span>
                  </div>
                  <div className="h-120 w-full">
                    <MonacoEditor
                      height="100%"
                      language="html"
                      theme={resolvedTheme === "dark" ? "vs-dark" : "vs-light"}
                      value={studioState.htmlContent}
                      onChange={(val) =>
                        setStudioState((prev) => ({ ...prev, htmlContent: val ?? "" }))
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
              ) : (
                <div className="border-border/80 bg-card flex flex-col overflow-hidden rounded-2xl border shadow-xs">
                  <div className="h-150 w-full">
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
                htmlContent={studioState.htmlContent}
                subject={studioState.subject}
                senderName={studioState.senderName}
                fromEmail={studioState.fromEmail}
                replyTo={studioState.replyTo}
                bodyMaxHeight="min-h-112.5"
              />
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
