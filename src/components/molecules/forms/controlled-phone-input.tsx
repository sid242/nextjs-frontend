"use client";

import {
  Controller,
  useFormContext,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { FormPhoneInput, type FormPhoneInputProps } from "./form-phone-input";

export interface ControlledPhoneInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FormPhoneInputProps, "name" | "value" | "defaultValue" | "onChange"> {
  name: TName;
  control?: Control<TFieldValues>;
  handleChange?: (value: string) => void;
}

/**
 * Production-grade Controlled Phone Input component integrated with React Hook Form.
 * Automatically resolves `control` from `FormWrapper` / `FormProvider` context,
 * manages national digits + country dial codes (defaults to India +91),
 * and maps `fieldState.error` to user-facing validation messages.
 */
export function ControlledPhoneInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  handleChange,
  error,
  ...props
}: ControlledPhoneInputProps<TFieldValues, TName>) {
  const formContext = useFormContext<TFieldValues>();
  const resolvedControl = control ?? formContext?.control;

  if (!resolvedControl) {
    throw new Error(
      `ControlledPhoneInput for "${String(name)}" must be used within a FormWrapper or passed an explicit "control" prop.`,
    );
  }

  return (
    <Controller
      name={name}
      control={resolvedControl}
      render={({ field, fieldState }) => (
        <FormPhoneInput
          {...props}
          id={props.id ?? String(name)}
          name={String(name)}
          value={field.value ?? ""}
          error={fieldState.error?.message ?? error}
          onChange={(val) => {
            field.onChange(val);
            handleChange?.(val);
          }}
        />
      )}
    />
  );
}
