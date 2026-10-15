"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface FormSelectProps {
  id?: string;
  name?: string;
  label?: string;
  error?: string;
  hint?: string;
  badge?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export function FormSelect({
  id,
  name,
  label,
  error,
  hint,
  badge,
  required,
  disabled,
  placeholder = "Select an option",
  options,
  value,
  defaultValue,
  onValueChange,
  className,
  containerClassName,
  labelClassName,
}: FormSelectProps) {
  const autoId = React.useId();
  const fieldId = id ?? name ?? autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

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

      <Select
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={className}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-xs font-medium">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
