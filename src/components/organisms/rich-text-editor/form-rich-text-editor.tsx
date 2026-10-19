"use client";

import { useId, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { RichTextEditor, type RichTextEditorProps } from "./rich-text-editor";

export interface FormRichTextEditorProps extends Omit<RichTextEditorProps, "id" | "label"> {
  id?: string;
  name?: string;
  label?: ReactNode;
  error?: string;
  hint?: string;
  description?: string;
  helperText?: string;
  badge?: ReactNode;
  badgeClassName?: string;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

/**
 * Production-ready FormRichTextEditor organism conforming to the foundation form layout.
 * Supports labels, required indicators, hints, error messages, and badges.
 */
export function FormRichTextEditor({
  id,
  name,
  label,
  error,
  hint,
  description,
  helperText,
  badge,
  badgeClassName,
  required,
  className,
  containerClassName,
  labelClassName,
  errorClassName,
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
}: FormRichTextEditorProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const resolvedHint = hint ?? description ?? helperText;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  return (
    <div className={cn("grid gap-1.5", containerClassName)}>
      {label || badge ? (
        <div className="flex items-center justify-between">
          {label ? (
            <Label htmlFor={fieldId} className={cn(error && "text-destructive", labelClassName)}>
              {label}
              {required ? <span className="text-destructive ml-1">*</span> : null}
            </Label>
          ) : null}
          {badge ? (
            <Badge variant="secondary" className={cn("px-1.5 py-0 text-[10px]", badgeClassName)}>
              {badge}
            </Badge>
          ) : null}
        </div>
      ) : null}

      <div className="relative">
        <RichTextEditor
          id={fieldId}
          value={value ?? ""}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(error && "border-destructive", className)}
        />
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className={cn("text-destructive text-xs font-medium", errorClassName)}
        >
          {error}
        </p>
      ) : resolvedHint ? (
        <p id={hintId} className="text-muted-foreground text-xs">
          {resolvedHint}
        </p>
      ) : null}
    </div>
  );
}
