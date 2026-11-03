"use client";

import { useId, type ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface FormSwitchProps {
  id?: string;
  name?: string;
  label?: ReactNode;
  description?: ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  containerClassName?: string;
}

export function FormSwitch({
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
}: FormSwitchProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const errorId = `${fieldId}-error`;
  const descId = `${fieldId}-desc`;
  const describedBy = error ? errorId : description ? descId : undefined;

  return (
    <div className={cn("grid gap-1.5", containerClassName)}>
      <div className="flex items-center justify-between gap-4">
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

        <Switch
          id={fieldId}
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={className}
        />
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
