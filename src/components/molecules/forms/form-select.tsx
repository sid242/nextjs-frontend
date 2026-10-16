"use client";

import { useId, type ReactNode, type Ref } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  VirtualizedSelect,
  type SelectOption,
  type SelectValue,
  type VirtualizedSelectProps,
} from "@/components/ui/virtualized-select";
import { cn } from "@/lib/utils";

export type { SelectOption, SelectValue };

export interface FormSelectProps<T extends string | number = string> extends Omit<
  VirtualizedSelectProps<T>,
  "id" | "name" | "error" | "ref"
> {
  id?: string;
  name?: string;
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
  ref?: Ref<HTMLDivElement>;
}

export function FormSelect<T extends string | number = string>({
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
  placeholder = "Select an option…",
  options,
  value,
  defaultValue,
  onValueChange,
  className,
  containerClassName,
  labelClassName,
  errorClassName,
  isSearchable = true,
  isClearable = true,
  isMultiSelect = false,
  loading = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onSearchChange,
  ref,
  ...props
}: FormSelectProps<T>) {
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

      <VirtualizedSelect
        ref={ref}
        id={fieldId}
        name={name}
        options={options}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        placeholder={placeholder}
        disabled={disabled}
        error={Boolean(error)}
        isSearchable={isSearchable}
        isClearable={isClearable}
        isMultiSelect={isMultiSelect}
        loading={loading}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={onLoadMore}
        onSearchChange={onSearchChange}
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
