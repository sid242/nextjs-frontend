"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import {
  Controller,
  useFormContext,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface CountryDialOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  placeholder?: string;
}

export const COUNTRY_DIAL_OPTIONS: CountryDialOption[] = [
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳", placeholder: "98765 43210" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸", placeholder: "202 555 0123" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧", placeholder: "7911 123456" },
  {
    code: "AE",
    name: "United Arab Emirates",
    dialCode: "+971",
    flag: "🇦🇪",
    placeholder: "50 123 4567",
  },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬", placeholder: "8123 4567" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺", placeholder: "412 345 678" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", placeholder: "416 555 0123" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪", placeholder: "151 12345678" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷", placeholder: "6 12 34 56 78" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦", placeholder: "50 123 4567" },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵", placeholder: "90 1234 5678" },
];

export function parsePhoneNumber(
  fullPhone: string | null | undefined,
  defaultCountryCode = "IN",
): { dialCode: string; nationalNumber: string; countryCode: string } {
  const defaultOption =
    COUNTRY_DIAL_OPTIONS.find((c) => c.code === defaultCountryCode) ?? COUNTRY_DIAL_OPTIONS[0]!;

  if (!fullPhone || typeof fullPhone !== "string") {
    return {
      dialCode: defaultOption.dialCode,
      nationalNumber: "",
      countryCode: defaultOption.code,
    };
  }

  const cleaned = fullPhone.trim();
  if (!cleaned.startsWith("+")) {
    return {
      dialCode: defaultOption.dialCode,
      nationalNumber: cleaned.replace(/\D/g, ""),
      countryCode: defaultOption.code,
    };
  }

  // Sort by dialCode length desc so +971 is matched before +9 etc.
  const sorted = [...COUNTRY_DIAL_OPTIONS].sort((a, b) => b.dialCode.length - a.dialCode.length);
  const matched = sorted.find((opt) => cleaned.startsWith(opt.dialCode));

  if (matched) {
    const nationalNumber = cleaned.slice(matched.dialCode.length).replace(/\D/g, "");
    return { dialCode: matched.dialCode, nationalNumber, countryCode: matched.code };
  }

  return {
    dialCode: defaultOption.dialCode,
    nationalNumber: cleaned.replace(/\D/g, ""),
    countryCode: defaultOption.code,
  };
}

export interface PhoneInputProps {
  id?: string;
  name?: string;
  label?: ReactNode;
  value?: string | null;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  defaultCountryCode?: string;
  onChange?: (e164Value: string) => void;
}

export function PhoneInput({
  id,
  name,
  label,
  value = "",
  error,
  hint,
  required,
  disabled,
  className,
  containerClassName,
  defaultCountryCode = "IN",
  onChange,
}: PhoneInputProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  const parsed = useMemo(
    () => parsePhoneNumber(value, defaultCountryCode),
    [value, defaultCountryCode],
  );

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(parsed.countryCode);
  const [nationalNumber, setNationalNumber] = useState<string>(parsed.nationalNumber);

  // Sync internal state if prop value changes externally
  const activeCountry =
    COUNTRY_DIAL_OPTIONS.find((c) => c.code === selectedCountryCode) ?? COUNTRY_DIAL_OPTIONS[0]!;

  const handleCountryChange = (newCountryCode: string) => {
    setSelectedCountryCode(newCountryCode);
    const newOpt = COUNTRY_DIAL_OPTIONS.find((c) => c.code === newCountryCode);
    if (!newOpt) return;

    if (nationalNumber.trim()) {
      onChange?.(`${newOpt.dialCode}${nationalNumber.trim()}`);
    }
  };

  const handleNumberChange = (rawInput: string) => {
    const digitsOnly = rawInput.replace(/\D/g, "");
    setNationalNumber(digitsOnly);

    if (!digitsOnly) {
      onChange?.("");
    } else {
      onChange?.(`${activeCountry.dialCode}${digitsOnly}`);
    }
  };

  return (
    <div className={cn("grid gap-1.5", containerClassName)}>
      {label ? (
        <Label htmlFor={fieldId} className={cn(error && "text-destructive")}>
          {label}
          {required ? <span className="text-destructive ml-1">*</span> : null}
        </Label>
      ) : null}

      <div className="flex items-center gap-2">
        <Select value={activeCountry.code} onValueChange={handleCountryChange} disabled={disabled}>
          <SelectTrigger className="w-[110px] shrink-0 font-medium">
            <SelectValue placeholder="Code">
              <span className="flex items-center gap-1.5">
                <span>{activeCountry.flag}</span>
                <span className="text-xs">{activeCountry.dialCode}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {COUNTRY_DIAL_OPTIONS.map((opt) => (
              <SelectItem key={`${opt.code}-${opt.dialCode}`} value={opt.code}>
                <span className="flex items-center gap-2">
                  <span>{opt.flag}</span>
                  <span className="font-medium">{opt.name}</span>
                  <span className="text-muted-foreground font-mono text-xs">({opt.dialCode})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          id={fieldId}
          name={name}
          type="tel"
          inputMode="tel"
          disabled={disabled}
          placeholder={activeCountry.placeholder ?? "Phone number"}
          value={nationalNumber}
          onChange={(e) => handleNumberChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn("flex-1", className)}
        />
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-xs font-medium">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface ControlledPhoneInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<PhoneInputProps, "name" | "value" | "onChange"> {
  name: TName;
  control?: Control<TFieldValues>;
}

export function ControlledPhoneInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, control, error, ...props }: ControlledPhoneInputProps<TFieldValues, TName>) {
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
        <PhoneInput
          {...props}
          id={props.id ?? String(name)}
          name={String(name)}
          value={field.value ?? ""}
          error={fieldState.error?.message ?? error}
          onChange={field.onChange}
        />
      )}
    />
  );
}
