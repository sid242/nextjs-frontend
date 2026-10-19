"use client";

import * as React from "react";
import {
  Controller,
  useFormContext,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { FormRadioGroup, type FormRadioGroupProps } from "./form-radio-group";

export interface ControlledRadioGroupProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FormRadioGroupProps, "name" | "value" | "defaultValue" | "onValueChange"> {
  name: TName;
  control?: Control<TFieldValues>;
  handleChange?: (value: string) => void;
}

/**
 * Production-grade Controlled RadioGroup component integrated with React Hook Form.
 */
export function ControlledRadioGroup<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  handleChange,
  error,
  ...props
}: ControlledRadioGroupProps<TFieldValues, TName>) {
  const formContext = useFormContext<TFieldValues>();
  const resolvedControl = control ?? formContext?.control;

  if (!resolvedControl) {
    throw new Error(
      `ControlledRadioGroup for "${String(name)}" must be used within a FormWrapper or passed an explicit "control" prop.`,
    );
  }

  return (
    <Controller
      name={name}
      control={resolvedControl}
      render={({ field, fieldState }) => (
        <FormRadioGroup
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
