"use client";

import * as React from "react";
import {
  Controller,
  useFormContext,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { FormSelect, type FormSelectProps } from "./form-select";

export interface ControlledSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FormSelectProps, "name" | "value" | "defaultValue" | "onValueChange"> {
  name: TName;
  control?: Control<TFieldValues>;
  handleChange?: (value: string) => void;
}

/**
 * Production-grade Controlled Select component integrated with React Hook Form.
 * Automatically resolves `control` from `FormWrapper` and handles error states.
 */
export function ControlledSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, control, handleChange, error, ...props }: ControlledSelectProps<TFieldValues, TName>) {
  const formContext = useFormContext<TFieldValues>();
  const resolvedControl = control ?? formContext?.control;

  if (!resolvedControl) {
    throw new Error(
      `ControlledSelect for "${String(name)}" must be used within a FormWrapper or passed an explicit "control" prop.`,
    );
  }

  return (
    <Controller
      name={name}
      control={resolvedControl}
      render={({ field, fieldState }) => (
        <FormSelect
          {...props}
          id={props.id ?? String(name)}
          name={field.name}
          value={field.value ?? ""}
          error={fieldState.error?.message ?? error}
          onValueChange={(val) => {
            field.onChange(val);
            handleChange?.(val);
          }}
        />
      )}
    />
  );
}
