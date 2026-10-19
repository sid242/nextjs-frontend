import {
  useMemo,
  type ChangeEvent,
  type ClipboardEvent,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type Ref,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const inputVariants = cva(
  "border-input selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default: "",
        minimal: "border-0 bg-muted/40 px-4 py-2 shadow-none focus-visible:ring-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface InputProps
  extends Omit<ComponentProps<"input">, "ref">, VariantProps<typeof inputVariants> {
  ref?: Ref<HTMLInputElement>;
  /** Restrict input strictly to numeric characters and prevent invalid keys like 'e', '+', '-' */
  onlyNumber?: boolean;
  /** Format number input with thousand separator commas */
  useSeparator?: boolean;
  /** Format with Indian numbering system (e.g., 1,00,000) instead of international (100,000) */
  indianSeparator?: boolean;
  /** Allow decimals when onlyNumber or type="number" is used */
  allowDecimal?: boolean;
}

export function formatNumberWithCommas(
  val: string | number,
  indianSeparator: boolean = false,
): string {
  if (val === null || val === undefined || val === "") return "";

  const stringValue = val?.toString?.()?.replaceAll(/[^\d.]/g, "") ?? "";
  const [integer, decimal] = stringValue?.split(".") ?? [];

  if (!integer && decimal === undefined) return "";

  const locale = indianSeparator ? "en-IN" : "en-US";
  const formattedInteger = integer ? new Intl.NumberFormat(locale).format(Number(integer)) : "";

  return decimal === undefined ? formattedInteger : `${formattedInteger}.${decimal}`;
}

export function Input({
  className,
  type = "text",
  variant = "default",
  value,
  defaultValue,
  onChange,
  onFocus,
  onKeyDown,
  onPaste,
  onlyNumber,
  useSeparator,
  indianSeparator = false,
  allowDecimal = true,
  maxLength,
  ref,
  ...props
}: InputProps) {
  const isNumeric = type === "number" || Boolean(onlyNumber);
  const shouldSeparate = isNumeric && Boolean(useSeparator);

  // Compute display value when separator is enabled
  const displayValue = useMemo(() => {
    if (shouldSeparate && value !== undefined) {
      return formatNumberWithCommas(value as string | number, indianSeparator);
    }
    return value;
  }, [value, shouldSeparate, indianSeparator]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Native maxLength is ignored by browsers for type="number"
    if (isNumeric && maxLength && (e?.target?.value?.length ?? 0) > maxLength) {
      e.target.value = e?.target?.value?.slice(0, maxLength) ?? "";
    }

    if (shouldSeparate) {
      // Strip commas before forwarding the clean numeric value to parent/state
      const rawValue = e?.target?.value?.replaceAll(",", "") ?? "";
      Object.defineProperty(e.target, "value", { value: rawValue, writable: true });
      onChange?.(e);
    } else {
      onChange?.(e);
    }
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    if (type === "number") {
      // Prevent accidental value changes when scrolling with mouse wheel over focused input
      e?.target?.addEventListener(
        "wheel",
        (event: WheelEvent) => {
          event?.preventDefault?.();
        },
        { passive: false },
      );
    }
    onFocus?.(e);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Prevent leading space
    if (e?.key === " " && e?.currentTarget?.selectionStart === 0) {
      e?.preventDefault?.();
    }

    if (isNumeric) {
      // Prevent scientific notation 'e'/'E' and symbols '+', '-'
      if (["e", "E", "+", "-"].includes(e?.key)) {
        e?.preventDefault?.();
      }

      // If onlyNumber is specified, block non-digit characters (allow navigation/editing keys)
      if (
        onlyNumber &&
        !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter", "Home", "End"].includes(
          e?.key,
        ) &&
        !e?.ctrlKey &&
        !e?.metaKey
      ) {
        const isDecimalAllowed =
          allowDecimal && e?.key === "." && !e?.currentTarget?.value?.includes(".");
        if (!/^\d$/.test(e?.key) && !isDecimalAllowed) {
          e?.preventDefault?.();
        }
      }
    }

    onKeyDown?.(e);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (isNumeric) {
      const pasteText = e?.clipboardData?.getData("text")?.replaceAll(",", "") ?? "";
      if (Number.isNaN(Number(pasteText)) || pasteText?.trim() === "") {
        e?.preventDefault?.();
      }
    }
    onPaste?.(e);
  };

  return (
    <input
      ref={ref}
      type={shouldSeparate ? "text" : type}
      inputMode={shouldSeparate || (onlyNumber && type !== "number") ? "decimal" : props.inputMode}
      data-slot="input"
      className={cn(inputVariants({ variant }), className)}
      value={shouldSeparate && value !== undefined ? displayValue : value}
      defaultValue={defaultValue}
      maxLength={maxLength}
      onChange={handleInputChange}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      {...props}
    />
  );
}
