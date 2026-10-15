"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface FormTextareaProps extends React.ComponentProps<"textarea"> {
  label?: string;
  error?: string;
  hint?: string;
  badge?: string;
  showCharacterLength?: boolean;
  containerClassName?: string;
  labelClassName?: string;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      id,
      name,
      label,
      error,
      hint,
      badge,
      required,
      showCharacterLength,
      className,
      containerClassName,
      labelClassName,
      value,
      maxLength,
      ...props
    },
    ref,
  ) => {
    const autoId = React.useId();
    const fieldId = id ?? name ?? autoId;
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;
    const describedBy = error ? errorId : hint ? hintId : undefined;

    const charCount = typeof value === "string" ? value.length : undefined;

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
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {badge}
              </Badge>
            ) : null}
          </div>
        ) : null}

        <Textarea
          ref={ref}
          id={fieldId}
          name={name}
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={className}
          {...props}
        />

        <div className="flex items-center justify-between gap-2">
          {error ? (
            <p id={errorId} role="alert" className="text-destructive text-xs font-medium">
              {error}
            </p>
          ) : hint ? (
            <p id={hintId} className="text-muted-foreground text-xs">
              {hint}
            </p>
          ) : (
            <span />
          )}

          {showCharacterLength && maxLength !== undefined && charCount !== undefined ? (
            <span className="text-muted-foreground text-[11px] tabular-nums">
              {charCount}/{maxLength}
            </span>
          ) : null}
        </div>
      </div>
    );
  },
);

FormTextarea.displayName = "FormTextarea";
