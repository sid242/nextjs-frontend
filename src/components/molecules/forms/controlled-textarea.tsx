"use client";

import * as React from "react";
import {
  Controller,
  useFormContext,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { FormTextarea, type FormTextareaProps } from "./form-textarea";

export interface ControlledTextareaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FormTextareaProps, "name" | "defaultValue"> {
  name: TName;
  control?: Control<TFieldValues>;
  handleChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

/**
 * Production-grade Controlled Textarea component integrated with React Hook Form.
 */
export function ControlledTextarea<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, control, handleChange, error, ...props }: ControlledTextareaProps<TFieldValues, TName>) {
  const formContext = useFormContext<TFieldValues>();
  const resolvedControl = control ?? formContext?.control;

  if (!resolvedControl) {
    throw new Error(
      `ControlledTextarea for "${String(name)}" must be used within a FormWrapper or passed an explicit "control" prop.`,
    );
  }

  return (
    <Controller
      name={name}
      control={resolvedControl}
      render={({ field, fieldState }) => (
        <FormTextarea
          {...props}
          {...field}
          id={props.id ?? String(name)}
          value={field.value ?? ""}
          error={fieldState.error?.message ?? error}
          onChange={(e) => {
            field.onChange(e);
            handleChange?.(e);
          }}
        />
      )}
    />
  );
}
