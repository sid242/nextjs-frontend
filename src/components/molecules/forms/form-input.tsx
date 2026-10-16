"use client";

import { useId, useState, type ChangeEvent, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, type InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FormInputProps extends Omit<InputProps, "prefix"> {
  label?: ReactNode;
  error?: string;
  hint?: string;
  description?: string;
  helperText?: string;
  badge?: ReactNode;
  badgeClassName?: string;
  showCharacterLength?: boolean;
  hidePasswordToggle?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  customElement?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

export function FormInput({
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
  type = "text",
  showCharacterLength,
  hidePasswordToggle,
  prefix,
  suffix,
  customElement,
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
}: FormInputProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const resolvedType = isPassword && showPassword ? "text" : type;

  const resolvedHint = hint ?? description ?? helperText;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = error ? errorId : resolvedHint ? hintId : undefined;

  // Derive character count without triggering cascading render effects
  const [uncontrolledLength, setUncontrolledLength] = useState(
    typeof defaultValue === "string" ? (defaultValue?.length ?? 0) : 0,
  );

  const charCount = typeof value === "string" ? (value?.length ?? 0) : uncontrolledLength;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
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

      <div className="relative flex items-center">
        {prefix ? (
          <div className="text-muted-foreground pointer-events-none absolute left-3 flex items-center">
            {prefix}
          </div>
        ) : null}

        <Input
          ref={ref}
          id={fieldId}
          name={name}
          type={resolvedType}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={handleInputChange}
          className={cn(prefix && "pl-9", (suffix || isPassword) && "pr-10", className)}
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
        ) : suffix ? (
          <div className="text-muted-foreground pointer-events-none absolute right-3 flex items-center">
            {suffix}
          </div>
        ) : null}

        {customElement}
      </div>

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
