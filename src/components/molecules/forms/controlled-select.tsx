"use client";

import {
  Controller,
  useFormContext,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { FormSelect, type FormSelectProps, type SelectOption } from "./form-select";

export interface ControlledSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TOptionValue extends string | number = string,
> extends Omit<FormSelectProps<TOptionValue>, "name" | "value" | "defaultValue" | "onValueChange"> {
  name: TName;
  control?: Control<TFieldValues>;
  /**
   * If true, saves only the primitive ID (`option.value`) into react-hook-form state.
   * Defaults to false (passes `{ label, value }` object) so API-paginated selects
   * retain their human-readable label regardless of active page.
   */
  returnPrimitiveValue?: boolean;
  handleChange?: (
    value:
      | SelectOption<TOptionValue>
      | SelectOption<TOptionValue>[]
      | TOptionValue
      | TOptionValue[]
      | null,
  ) => void;
}

/**
 * Production-grade Controlled Select component integrated with React Hook Form.
 * Automatically resolves `control` from `FormWrapper`, passes { label, value } to form
 * state to preserve labels in paginated/virtualized APIs, and binds field errors.
 */
export function ControlledSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TOptionValue extends string | number = string,
>({
  name,
  control,
  returnPrimitiveValue = false,
  handleChange,
  error,
  ...props
}: ControlledSelectProps<TFieldValues, TName, TOptionValue>) {
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
          id={props?.id ?? String(name)}
          name={field?.name}
          value={field?.value}
          error={fieldState?.error?.message ?? error}
          onValueChange={(selected) => {
            const formVal:
              | SelectOption<TOptionValue>
              | SelectOption<TOptionValue>[]
              | TOptionValue
              | TOptionValue[]
              | null =
              returnPrimitiveValue && selected && !Array.isArray(selected)
                ? (selected as SelectOption<TOptionValue>)?.value
                : returnPrimitiveValue && Array.isArray(selected)
                  ? selected?.map((s) => s?.value)
                  : selected;

            field?.onChange?.(formVal);
            handleChange?.(formVal);
          }}
        />
      )}
    />
  );
}
