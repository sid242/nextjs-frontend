"use client";

import {
  Controller,
  useFormContext,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { FormIconPicker, type FormIconPickerProps } from "./form-icon-picker";

export interface ControlledIconPickerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<
  FormIconPickerProps,
  "name" | "value" | "defaultValue" | "onChange" | "onValueChange"
> {
  name: TName;
  control?: Control<TFieldValues>;
  handleChange?: (value: string) => void;
}

/**
 * Production-grade Controlled IconPicker component integrated with React Hook Form.
 * Automatically resolves `control` from `FormWrapper`, binds field value and errors.
 */
export function ControlledIconPicker<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  handleChange,
  error,
  ...props
}: ControlledIconPickerProps<TFieldValues, TName>) {
  const formContext = useFormContext<TFieldValues>();
  const resolvedControl = control ?? formContext?.control;

  if (!resolvedControl) {
    throw new Error(
      `ControlledIconPicker for "${String(name)}" must be used within a FormWrapper or passed an explicit "control" prop.`,
    );
  }

  return (
    <Controller
      name={name}
      control={resolvedControl}
      render={({ field, fieldState }) => (
        <FormIconPicker
          {...props}
          id={props?.id ?? String(name)}
          name={field?.name}
          value={field?.value ?? ""}
          error={fieldState?.error?.message ?? error}
          onChange={(val) => {
            field?.onChange?.(val);
            handleChange?.(val);
          }}
        />
      )}
    />
  );
}
