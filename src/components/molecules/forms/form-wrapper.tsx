"use client";

import * as React from "react";
import {
  FormProvider,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";

import { cn } from "@/lib/utils";

export interface FormWrapperProps<T extends FieldValues> extends Omit<
  React.ComponentProps<"form">,
  "onSubmit"
> {
  methods: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
}

/**
 * Production-grade form wrapper providing React Hook Form context (FormProvider)
 * and handling type-safe submit handling with onSubmit callback.
 */
export function FormWrapper<T extends FieldValues>({
  methods,
  onSubmit,
  className,
  children,
  method = "POST",
  action = "#",
  ...props
}: FormWrapperProps<T>) {
  return (
    <FormProvider {...methods}>
      <form
        className={cn("space-y-4", className)}
        onSubmit={(e) => {
          e.preventDefault();
          void methods.handleSubmit(onSubmit)(e);
        }}
        method={method}
        action={action}
        noValidate
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  );
}
