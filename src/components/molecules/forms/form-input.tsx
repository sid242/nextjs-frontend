"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FormInputProps extends React.ComponentProps<"input"> {
  label?: string;
  error?: string;
  hint?: string;
  badge?: string;
  showCharacterLength?: boolean;
  hidePasswordToggle?: boolean;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      id,
      name,
      label,
      error,
      hint,
      badge,
      required,
      type = "text",
      showCharacterLength,
      hidePasswordToggle,
      startAdornment,
      endAdornment,
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
    const [showPassword, setShowPassword] = React.useState(false);

    const isPassword = type === "password";
    const resolvedType = isPassword && showPassword ? "text" : type;

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

        <div className="relative flex items-center">
          {startAdornment ? (
            <div className="text-muted-foreground pointer-events-none absolute left-3 flex items-center">
              {startAdornment}
            </div>
          ) : null}

          <Input
            ref={ref}
            id={fieldId}
            name={name}
            type={resolvedType}
            value={value}
            maxLength={maxLength}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              startAdornment && "pl-9",
              (endAdornment || isPassword) && "pr-10",
              className,
            )}
            {...props}
          />

          {isPassword && !hidePasswordToggle ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-muted-foreground hover:text-foreground absolute right-1 size-7"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          ) : endAdornment ? (
            <div className="text-muted-foreground pointer-events-none absolute right-3 flex items-center">
              {endAdornment}
            </div>
          ) : null}
        </div>

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

FormInput.displayName = "FormInput";
