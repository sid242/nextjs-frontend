"use client";

import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FormCheckboxProps {
  id?: string;
  name?: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  containerClassName?: string;
}

export function FormCheckbox({
  id,
  name,
  label,
  description,
  error,
  required,
  disabled,
  checked,
  defaultChecked,
  onCheckedChange,
  className,
  containerClassName,
}: FormCheckboxProps) {
  const autoId = React.useId();
  const fieldId = id ?? name ?? autoId;
  const errorId = `${fieldId}-error`;
  const descId = `${fieldId}-desc`;
  const describedBy = error ? errorId : description ? descId : undefined;

  return (
    <div className={cn("grid gap-1.5", containerClassName)}>
      <div className="flex items-start gap-2.5">
        <Checkbox
          id={fieldId}
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={(val) => onCheckedChange?.(val === true)}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn("mt-0.5", className)}
        />
        {label ? (
          <div className="grid gap-0.5 leading-none">
            <Label
              htmlFor={fieldId}
              className={cn("cursor-pointer font-medium select-none", error && "text-destructive")}
            >
              {label}
              {required ? <span className="text-destructive ml-1">*</span> : null}
            </Label>
            {description ? (
              <p id={descId} className="text-muted-foreground text-xs">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
