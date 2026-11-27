"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  PhoneCallIcon,
  PlusIcon,
  SmartphoneIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/errors";

import { useCreateTemplateMutation, useUpdateTemplateMutation } from "../queries";
import {
  createTemplateSchema,
  type CreateTemplateFormValues,
  type TemplateButtonFormValues,
} from "../schemas";
import type { WhatsAppTemplate } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: WhatsAppTemplate | null;
}

interface TemplateButtonState extends TemplateButtonFormValues {
  id: string;
}

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English (en)" },
  { value: "en_US", label: "English US (en_US)" },
  { value: "en_GB", label: "English UK (en_GB)" },
  { value: "hi", label: "Hindi (hi)" },
  { value: "gu", label: "Gujarati (gu)" },
  { value: "ar", label: "Arabic (ar)" },
  { value: "es", label: "Spanish (es)" },
  { value: "fr", label: "French (fr)" },
];

const COMMON_VARIABLE_PRESETS = [
  { label: "Customer Name", variable: "{{1}}" },
  { label: "Booking / Order ID", variable: "{{2}}" },
  { label: "Date & Time", variable: "{{3}}" },
  { label: "Property / Product", variable: "{{4}}" },
  { label: "Amount / Price", variable: "{{5}}" },
];

export function WhatsAppTemplateBuilderDialog({ open, onOpenChange, template }: Props) {
  const isEditing = !!template;
  const createMutation = useCreateTemplateMutation();
  const updateMutation = useUpdateTemplateMutation();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [buttons, setButtons] = useState<TemplateButtonState[]>([]);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTemplateFormValues>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: "",
      category: "UTILITY",
      language: "en",
      headerType: "NONE",
      headerText: "",
      bodyText: "",
      footerText: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (template) {
      const comps = template.components ?? [];
      const header = comps.find((c) => c.type === "HEADER");
      const body = comps.find((c) => c.type === "BODY");
      const footer = comps.find((c) => c.type === "FOOTER");
      const btns = comps.find((c) => c.type === "BUTTONS")?.buttons ?? [];

      reset({
        name: template.name,
        category: template.category,
        language: template.language,
        headerType:
          (header?.format as "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO" | undefined) ?? "NONE",
        headerText: header?.text ?? "",
        bodyText: body?.text ?? "",
        footerText: footer?.text ?? "",
      });
      setButtons(
        btns.map((b, i) => ({
          id: `btn_edit_${i}_${Date.now()}`,
          type: (b.type === "OTP" ? "QUICK_REPLY" : b.type) as
            "QUICK_REPLY" | "URL" | "PHONE_NUMBER",
          text: b.text,
          value: b.url || b.phone_number || "",
        })),
      );
    } else {
      reset({
        name: "",
        category: "UTILITY",
        language: "en",
        headerType: "NONE",
        headerText: "",
        bodyText: "",
        footerText: "",
      });
      setButtons([]);
    }
  }, [open, template, reset]);

  const formValues = watch();

  // Helper to insert variable at cursor position in textarea
  const handleInsertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    const currentText = formValues.bodyText || "";

    if (textarea) {
      const start = textarea.selectionStart ?? currentText.length;
      const end = textarea.selectionEnd ?? currentText.length;
      const newText = currentText.substring(0, start) + variable + currentText.substring(end);
      setValue("bodyText", newText, { shouldValidate: true, shouldDirty: true });

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      setValue("bodyText", currentText + variable, { shouldValidate: true, shouldDirty: true });
    }
  };

  // Helper to copy variable placeholder to clipboard
  const handleCopyVariable = (variable: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(variable);
    setCopiedVar(variable);
    toast.success(`Copied ${variable} to clipboard!`);
    setTimeout(() => {
      setCopiedVar(null);
    }, 1500);
  };

  // Determine next unused sequence number for variable
  const getNextVariable = () => {
    const currentText = formValues.bodyText || "";
    const matches = currentText.match(/\{\{(\d+)\}\}/g) || [];
    if (matches.length === 0) return "{{1}}";
    const numbers = matches.map((m) => parseInt(m.replace(/\D/g, ""), 10));
    const max = Math.max(...numbers);
    return `{{${max + 1}}}`;
  };

  // Button management
  const handleAddButton = () => {
    if (buttons.length >= 10) {
      toast.error("WhatsApp allows a maximum of 10 interactive buttons.");
      return;
    }
    const newBtn: TemplateButtonState = {
      id: `btn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: "QUICK_REPLY",
      text: "",
      value: "",
    };
    setButtons((prev) => [...prev, newBtn]);
  };

  const handleUpdateButton = (id: string, updates: Partial<TemplateButtonState>) => {
    setButtons((prev) => prev.map((btn) => (btn.id === id ? { ...btn, ...updates } : btn)));
  };

  const handleRemoveButton = (id: string) => {
    setButtons((prev) => prev.filter((btn) => btn.id !== id));
  };

  const onSubmit = async (values: CreateTemplateFormValues) => {
    const components: Record<string, unknown>[] = [];

    // Header component
    if (values.headerType === "TEXT" && values.headerText) {
      components.push({
        type: "HEADER",
        format: "TEXT",
        text: values.headerText,
      });
    } else if (values.headerType !== "NONE") {
      components.push({
        type: "HEADER",
        format: values.headerType,
      });
    }

    // Body component
    components.push({
      type: "BODY",
      text: values.bodyText,
    });

    // Footer component
    if (values.footerText) {
      components.push({
        type: "FOOTER",
        text: values.footerText,
      });
    }

    // Multiple Buttons component
    const validButtons = buttons.filter((b) => b.text.trim().length > 0);
    if (validButtons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: validButtons.map((b) => {
          if (b.type === "URL") {
            return {
              type: "URL",
              text: b.text.trim(),
              url: b.value?.trim() || "https://example.com",
            };
          }
          if (b.type === "PHONE_NUMBER") {
            return {
              type: "PHONE_NUMBER",
              text: b.text.trim(),
              phone_number: b.value?.trim() || "+14155552671",
            };
          }
          return {
            type: "QUICK_REPLY",
            text: b.text.trim(),
          };
        }),
      });
    }

    try {
      if (isEditing && template) {
        await updateMutation.mutateAsync({
          id: template.id,
          data: {
            category: values.category,
            components,
          },
        });
        toast.success("Template updated successfully!");
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          category: values.category,
          language: values.language,
          components,
        });
        toast.success("Template draft created successfully!");
      }
      reset();
      setButtons([]);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        getErrorMessage(err, isEditing ? "Failed to update template" : "Failed to create template"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="text-primary h-5 w-5" />
            {isEditing ? "Edit WhatsApp Message Template" : "Create WhatsApp Message Template"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update template category, message body, header, footer, or interactive buttons."
              : "Design a custom Meta-compliant message template with dynamic variables, multiple interactive buttons, and live mobile preview."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-6 py-2 md:grid-cols-12"
        >
          {/* Builder Form Left Pane (7 cols) */}
          <div className="space-y-4 md:col-span-7">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. visit_reminder"
                  disabled={isEditing}
                  {...register("name")}
                />
                {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select
                  value={formValues.category}
                  onValueChange={(val: "UTILITY" | "MARKETING" | "AUTHENTICATION") =>
                    setValue("category", val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTILITY">Utility</SelectItem>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Language *</Label>
                <Select
                  value={formValues.language}
                  onValueChange={(val) => setValue("language", val)}
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Header */}
            <div className="bg-muted/20 space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold tracking-wider uppercase">
                  Header (Optional)
                </Label>
                <Select
                  value={formValues.headerType}
                  onValueChange={(val: "NONE" | "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO") =>
                    setValue("headerType", val)
                  }
                >
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    <SelectItem value="TEXT">Text</SelectItem>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formValues.headerType === "TEXT" && (
                <Input
                  placeholder="Enter header text"
                  {...register("headerText")}
                  className="mt-2 text-sm"
                />
              )}
            </div>

            {/* Body & Variable Helper */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bodyText">Body Text *</Label>
                <span className="text-muted-foreground text-[11px]">
                  Use positional variables like &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125;
                </span>
              </div>

              {/* Copy & Insert Variable Toolbar */}
              <div className="bg-muted/30 space-y-2 rounded-lg border p-2.5">
                <div className="text-muted-foreground flex items-center justify-between text-xs font-medium">
                  <span>Dynamic Placeholders: Click chip to insert or click icon to copy</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleInsertVariable(getNextVariable())}
                    className="text-primary hover:bg-primary/10 h-6 gap-1 px-2 text-xs"
                  >
                    <PlusIcon className="h-3 w-3" />
                    Insert Next ({getNextVariable()})
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {["{{1}}", "{{2}}", "{{3}}", "{{4}}", "{{5}}"].map((v) => (
                    <div
                      key={v}
                      onClick={() => handleInsertVariable(v)}
                      className="group bg-background hover:bg-muted/80 inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 font-mono text-xs font-medium shadow-2xs transition-colors"
                      title={`Click to insert ${v} at cursor`}
                    >
                      <span>{v}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyVariable(v, e)}
                        className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                        title={`Copy ${v} to clipboard`}
                      >
                        {copiedVar === v ? (
                          <CheckIcon className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <CopyIcon className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Quick Variable Presets */}
                <div className="border-border/50 flex flex-wrap items-center gap-1.5 border-t pt-1">
                  <span className="text-muted-foreground mr-1 text-[11px]">Presets:</span>
                  {COMMON_VARIABLE_PRESETS.map((preset) => (
                    <Badge
                      key={preset.label}
                      variant="outline"
                      className="hover:bg-muted cursor-pointer gap-1 text-[11px] font-normal"
                      onClick={() => handleInsertVariable(preset.variable)}
                      title={`Insert ${preset.variable} (${preset.label})`}
                    >
                      <span className="text-primary font-mono font-semibold">
                        {preset.variable}
                      </span>
                      <span>{preset.label}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyVariable(preset.variable, e)}
                        className="text-muted-foreground hover:text-foreground ml-0.5"
                        title={`Copy ${preset.variable}`}
                      >
                        {copiedVar === preset.variable ? (
                          <CheckIcon className="h-2.5 w-2.5 text-emerald-500" />
                        ) : (
                          <CopyIcon className="h-2.5 w-2.5 opacity-60" />
                        )}
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              {(() => {
                const { ref, ...rest } = register("bodyText");
                return (
                  <Textarea
                    id="bodyText"
                    rows={4}
                    placeholder="Hello {{1}}, your property visit to {{2}} is confirmed for {{3}}."
                    {...rest}
                    ref={(e) => {
                      ref(e);
                      textareaRef.current = e;
                    }}
                  />
                );
              })()}
              {errors.bodyText && (
                <p className="text-destructive text-xs">{errors.bodyText.message}</p>
              )}
            </div>

            {/* Footer */}
            <div className="space-y-1.5">
              <Label htmlFor="footerText">Footer (Optional)</Label>
              <Input
                id="footerText"
                placeholder="e.g. Thank you for choosing Acme Homes."
                {...register("footerText")}
              />
            </div>

            {/* Multiple Interactive Buttons */}
            <div className="bg-muted/20 space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold tracking-wider uppercase">
                    Interactive Buttons ({buttons.length}/10)
                  </Label>
                  <p className="text-muted-foreground text-[11px]">
                    Add quick replies, call-to-actions, or website links (Meta allows up to 10
                    buttons).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddButton}
                  disabled={buttons.length >= 10}
                  className="h-8 gap-1 text-xs"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add Button
                </Button>
              </div>

              {buttons.length === 0 ? (
                <div className="text-muted-foreground rounded-md border border-dashed p-3 text-center text-xs">
                  No interactive buttons added. Click &quot;Add Button&quot; to attach Quick Replies
                  or Links.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {buttons.map((btn, idx) => (
                    <div
                      key={btn.id}
                      className="bg-background space-y-2 rounded-lg border p-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground text-xs font-semibold">
                          Button #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <Select
                            value={btn.type}
                            onValueChange={(val: "QUICK_REPLY" | "URL" | "PHONE_NUMBER") =>
                              handleUpdateButton(btn.id, { type: val })
                            }
                          >
                            <SelectTrigger className="h-7 w-36 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="QUICK_REPLY">Quick Reply</SelectItem>
                              <SelectItem value="URL">Website URL</SelectItem>
                              <SelectItem value="PHONE_NUMBER">Phone Number</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveButton(btn.id)}
                            className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                            title="Remove button"
                          >
                            <Trash2Icon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Input
                          placeholder="Button Label (e.g. Confirm Visit)"
                          value={btn.text}
                          maxLength={25}
                          onChange={(e) => handleUpdateButton(btn.id, { text: e.target.value })}
                          className="h-8 text-xs"
                        />
                        {btn.type !== "QUICK_REPLY" && (
                          <Input
                            placeholder={
                              btn.type === "URL" ? "https://example.com/details" : "+14155552671"
                            }
                            value={btn.value || ""}
                            onChange={(e) => handleUpdateButton(btn.id, { value: e.target.value })}
                            className="h-8 text-xs"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Mobile Phone Mock Preview Right Pane (5 cols) */}
          <div className="bg-muted/30 flex flex-col items-center justify-start rounded-xl border p-4 md:col-span-5">
            <div className="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs">
              <SmartphoneIcon className="h-4 w-4" />
              <span>WhatsApp Mobile Preview</span>
            </div>

            <div className="border-foreground/20 bg-background flex w-[280px] flex-col overflow-hidden rounded-3xl border-4 text-sm shadow-lg">
              {/* WhatsApp chat topbar */}
              <div className="flex items-center gap-2 bg-emerald-600 p-2.5 text-white dark:bg-emerald-700">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                  WA
                </div>
                <div className="flex flex-col">
                  <span className="text-xs leading-none font-medium">Your Business</span>
                  <span className="text-[10px] text-white/80">Official Business Account</span>
                </div>
              </div>

              {/* Chat bubble background */}
              <div className="flex min-h-[300px] flex-col justify-end bg-[#e5ddd5] p-3 dark:bg-zinc-900/80">
                <div className="text-foreground space-y-1.5 rounded-lg rounded-tl-none border bg-white p-2.5 text-xs shadow-sm dark:bg-zinc-800">
                  {formValues.headerType === "TEXT" && formValues.headerText && (
                    <p className="text-foreground font-bold">{formValues.headerText}</p>
                  )}
                  {formValues.headerType !== "NONE" && formValues.headerType !== "TEXT" && (
                    <div className="bg-muted text-muted-foreground flex h-24 items-center justify-center rounded text-[11px] font-medium">
                      [{formValues.headerType}] Media Header
                    </div>
                  )}
                  <p className="text-foreground/90 whitespace-pre-wrap">
                    {formValues.bodyText || "Your message body will appear here..."}
                  </p>
                  {formValues.footerText && (
                    <p className="text-muted-foreground border-t pt-1 text-[10px]">
                      {formValues.footerText}
                    </p>
                  )}
                </div>

                {/* Multiple Preview Buttons */}
                {buttons.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {buttons
                      .filter((b) => b.text.trim().length > 0)
                      .map((btn) => (
                        <div
                          key={btn.id}
                          className="flex cursor-default items-center justify-center gap-1.5 rounded border bg-white px-2 py-1.5 text-center text-xs font-semibold text-emerald-600 shadow-xs dark:bg-zinc-800 dark:text-emerald-400"
                        >
                          {btn.type === "URL" && <ExternalLinkIcon className="h-3 w-3 shrink-0" />}
                          {btn.type === "PHONE_NUMBER" && (
                            <PhoneCallIcon className="h-3 w-3 shrink-0" />
                          )}
                          <span className="truncate">{btn.text}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-full flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Save Draft Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
