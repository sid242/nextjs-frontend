"use client";

import * as React from "react";
import {
  Controller,
  useFormContext,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { FormCheckbox, type FormCheckboxProps } from "./form-checkbox";

export interface ControlledCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FormCheckboxProps, "name" | "checked" | "defaultChecked" | "onCheckedChange"> {
  name: TName;
  control?: Control<TFieldValues>;
  handleChange?: (checked: boolean) => void;
}

/**
 * Production-grade Controlled Checkbox component integrated with React Hook Form.
 * Automatically wires boolean state and error messages.
 */
export function ControlledCheckbox<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, control, handleChange, error, ...props }: ControlledCheckboxProps<TFieldValues, TName>) {
  const formContext = useFormContext<TFieldValues>();
  const resolvedControl = control ?? formContext?.control;

  if (!resolvedControl) {
    throw new Error(
      `ControlledCheckbox for "${String(name)}" must be used within a FormWrapper or passed an explicit "control" prop.`,
    );
  }

  return (
    <Controller
      name={name}
      control={resolvedControl}
      render={({ field, fieldState }) => (
        <FormCheckbox
          {...props}
          id={props.id ?? String(name)}
          name={field.name}
          checked={Boolean(field.value)}
          error={fieldState.error?.message ?? error}
          onCheckedChange={(checked) => {
            field.onChange(checked);
            handleChange?.(checked);
          }}
        />
      )}
    />
  );
}
