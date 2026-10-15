"use client";

import * as React from "react";
import {
  Controller,
  useFormContext,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { FormInput, type FormInputProps } from "./form-input";

export interface ControlledInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FormInputProps, "name" | "defaultValue"> {
  name: TName;
  control?: Control<TFieldValues>;
  handleChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Production-grade Controlled Input component integrated with React Hook Form.
 * Automatically resolves `control` from `FormWrapper` / `FormProvider` context
 * and maps `fieldState.error` to user-facing validation messages.
 */
export function ControlledInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, control, handleChange, error, ...props }: ControlledInputProps<TFieldValues, TName>) {
  const formContext = useFormContext<TFieldValues>();
  const resolvedControl = control ?? formContext?.control;

  if (!resolvedControl) {
    throw new Error(
      `ControlledInput for "${String(name)}" must be used within a FormWrapper or passed an explicit "control" prop.`,
    );
  }

  return (
    <Controller
      name={name}
      control={resolvedControl}
      render={({ field, fieldState }) => {
        const isCheckbox = props.type === "checkbox";
        return (
          <FormInput
            {...props}
            {...field}
            id={props.id ?? String(name)}
            checked={isCheckbox ? Boolean(field.value) : undefined}
            value={isCheckbox ? undefined : (field.value ?? "")}
            error={fieldState.error?.message ?? error}
            onChange={(e) => {
              field.onChange(e);
              handleChange?.(e);
            }}
          />
        );
      }}
    />
  );
}
