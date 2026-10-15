"use client";

import * as React from "react";
import {
  Controller,
  useFormContext,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { FormSwitch, type FormSwitchProps } from "./form-switch";

export interface ControlledSwitchProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FormSwitchProps, "name" | "checked" | "defaultChecked" | "onCheckedChange"> {
  name: TName;
  control?: Control<TFieldValues>;
  handleChange?: (checked: boolean) => void;
}

/**
 * Production-grade Controlled Switch component integrated with React Hook Form.
 */
export function ControlledSwitch<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, control, handleChange, error, ...props }: ControlledSwitchProps<TFieldValues, TName>) {
  const formContext = useFormContext<TFieldValues>();
  const resolvedControl = control ?? formContext?.control;

  if (!resolvedControl) {
    throw new Error(
      `ControlledSwitch for "${String(name)}" must be used within a FormWrapper or passed an explicit "control" prop.`,
    );
  }

  return (
    <Controller
      name={name}
      control={resolvedControl}
      render={({ field, fieldState }) => (
        <FormSwitch
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
