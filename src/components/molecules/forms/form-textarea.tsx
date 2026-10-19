"use client";

import { useId, useState, type ChangeEvent, type ComponentProps, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface FormTextareaProps extends ComponentProps<"textarea"> {
  label?: ReactNode;
  error?: string;
  hint?: string;
  description?: string;
  helperText?: string;
  badge?: ReactNode;
  badgeClassName?: string;
  showCharacterLength?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

export function FormTextarea({
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
  showCharacterLength,
  className,
  containerClassName,
  labelClassName,
  errorClassName,
  value,
  defaultValue,
  maxLength,
  onChange,
  ref,
  ...props
}: FormTextareaProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  const resolvedHint = hint ?? description ?? helperText;
  const describedBy = error ? errorId : resolvedHint ? hintId : undefined;

  // Derive character count without triggering cascading render effects
  const [uncontrolledLength, setUncontrolledLength] = useState(
    typeof defaultValue === "string" ? (defaultValue?.length ?? 0) : 0,
  );

  const charCount = typeof value === "string" ? (value?.length ?? 0) : uncontrolledLength;

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setUncontrolledLength(e?.target?.value?.length ?? 0);
    onChange?.(e);
  };

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

      <Textarea
        ref={ref}
        id={fieldId}
        name={name}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={handleTextareaChange}
        className={className}
        {...props}
      />

      <div className="flex items-center justify-between gap-2">
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
        ) : (
          <span />
        )}

        {showCharacterLength ? (
          <span
            className={cn("text-[11px] tabular-nums transition-colors", {
              "text-muted-foreground": maxLength === undefined || charCount < maxLength,
              "text-destructive font-semibold": maxLength !== undefined && charCount >= maxLength,
            })}
          >
            {maxLength !== undefined ? `${charCount}/${maxLength}` : `${charCount} chars`}
          </span>
        ) : null}
      </div>
    </div>
  );
}
