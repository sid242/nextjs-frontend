"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export interface RadioOption {
  label: React.ReactNode;
  value: string;
  description?: React.ReactNode;
  disabled?: boolean;
}

export interface FormRadioGroupProps {
  id?: string;
  name?: string;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  containerClassName?: string;
}

export function FormRadioGroup({
  id,
  name,
  label,
  error,
  hint,
  required,
  disabled,
  orientation = "vertical",
  options,
  value,
  defaultValue,
  onValueChange,
  className,
  containerClassName,
}: FormRadioGroupProps) {
  const autoId = React.useId();
  const groupId = id ?? name ?? autoId;
  const errorId = `${groupId}-error`;
  const hintId = `${groupId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn("grid gap-2", containerClassName)}>
      {label ? (
        <Label className={cn(error && "text-destructive")}>
          {label}
          {required ? <span className="text-destructive ml-1">*</span> : null}
        </Label>
      ) : null}

      <RadioGroup
        id={groupId}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          orientation === "horizontal" ? "flex flex-wrap gap-4" : "grid gap-2.5",
          className,
        )}
      >
        {options.map((option) => {
          const itemId = `${groupId}-${option.value}`;
          return (
            <div key={option.value} className="flex items-start gap-2.5">
              <RadioGroupItem
                value={option.value}
                id={itemId}
                disabled={option.disabled || disabled}
                className="mt-0.5"
              />
              <div className="grid gap-0.5 leading-none">
                <Label
                  htmlFor={itemId}
                  className={cn(
                    "cursor-pointer font-medium select-none",
                    (option.disabled || disabled) && "cursor-not-allowed opacity-50",
                  )}
                >
                  {option.label}
                </Label>
                {option.description ? (
                  <p className="text-muted-foreground text-xs">{option.description}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </RadioGroup>

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
