"use client";

import { useId, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { IconPicker, type IconPickerProps } from "./icon-picker";

export interface FormIconPickerProps extends IconPickerProps {
  label?: ReactNode;
  error?: string;
  hint?: string;
  description?: string;
  helperText?: string;
  badge?: ReactNode;
  badgeClassName?: string;
  required?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

export function FormIconPicker({
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
  disabled,
  placeholder = "Select an icon…",
  value,
  defaultValue,
  onChange,
  onValueChange,
  className,
  containerClassName,
  labelClassName,
  errorClassName,
  isClearable = true,
  iconSize = 18,
  pickerWidth = 320,
  ...props
}: FormIconPickerProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  const resolvedHint = hint ?? description ?? helperText;
  const describedBy = error ? errorId : resolvedHint ? hintId : undefined;

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

      <IconPicker
        id={fieldId}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onValueChange={onValueChange}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        isClearable={isClearable}
        iconSize={iconSize}
        pickerWidth={pickerWidth}
        className={className}
        aria-describedby={describedBy}
        {...props}
      />

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
