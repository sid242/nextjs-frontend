"use client";

import {
  Controller,
  useFormContext,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { FormRichTextEditor, type FormRichTextEditorProps } from "./form-rich-text-editor";

export interface ControlledRichTextEditorProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FormRichTextEditorProps, "name"> {
  name: TName;
  control?: Control<TFieldValues>;
  handleChange?: (value: string) => void;
}

/**
 * Production-grade Controlled RichTextEditor organism integrated with React Hook Form.
 * Automatically resolves `control` from `FormWrapper` / `FormProvider` context
 * and syncs field state, errors, and blur validation.
 */
export function ControlledRichTextEditor<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  handleChange,
  error,
  ...props
}: ControlledRichTextEditorProps<TFieldValues, TName>) {
  const formContext = useFormContext<TFieldValues>();
  const resolvedControl = control ?? formContext?.control;

  if (!resolvedControl) {
    throw new Error(
      `ControlledRichTextEditor for "${String(name)}" must be used within a FormWrapper or passed an explicit "control" prop.`,
    );
  }

  return (
    <Controller
      name={name}
      control={resolvedControl}
      render={({ field, fieldState }) => (
        <FormRichTextEditor
          {...props}
          id={props.id ?? String(name)}
          value={field.value ?? ""}
          error={fieldState.error?.message ?? error}
          onChange={(html) => {
            field.onChange(html);
            handleChange?.(html);
          }}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}
