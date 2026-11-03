"use client";

import { useId, useMemo, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
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

import { COUNTRY_DIAL_OPTIONS, DEFAULT_COUNTRY_CODE } from "./phone.constants";
import { parsePhoneNumber } from "./phone.utils";

export interface FormPhoneInputProps {
  id?: string;
  name?: string;
  label?: ReactNode;
  error?: string;
  hint?: string;
  description?: string;
  helperText?: string;
  badge?: ReactNode;
  badgeClassName?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  defaultCountryCode?: string;
  value?: string | null;
  defaultValue?: string;
  onChange?: (e164Value: string) => void;
}

export function FormPhoneInput({
  id,
  name,
  label,
  error,
  hint,
  description,
  helperText,
  badge,
  badgeClassName,
  required,
  disabled,
  className,
  containerClassName,
  labelClassName,
  errorClassName,
  defaultCountryCode = DEFAULT_COUNTRY_CODE,
  value,
  defaultValue,
  onChange,
}: FormPhoneInputProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const resolvedHint = hint ?? description ?? helperText;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = error ? errorId : resolvedHint ? hintId : undefined;

  const initialVal = typeof value !== "undefined" ? value : defaultValue;
  const parsed = useMemo(
    () => parsePhoneNumber(initialVal, defaultCountryCode),
    [initialVal, defaultCountryCode],
  );

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(parsed.countryCode);
  const [nationalNumber, setNationalNumber] = useState<string>(parsed.nationalNumber);

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
      {label || badge ? (
        <div className="flex items-center justify-between">
          {label ? (
            <Label htmlFor={fieldId} className={cn(error && "text-destructive", labelClassName)}>
              {label}
              {required ? <span className="text-destructive ml-1">*</span> : null}
            </Label>
          ) : null}
          {badge ? (
            <Badge variant="secondary" className={cn("px-1.5 py-0 text-[10px]", badgeClassName)}>
              {badge}
            </Badge>
          ) : null}
        </div>
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
          aria-describedby={describedBy}
          className={cn("flex-1", className)}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        {error ? (
          <p
            id={errorId}
            role="alert"
            className={cn("text-destructive text-xs font-medium", errorClassName)}
          >
            {error}
          </p>
        ) : resolvedHint ? (
          <p id={hintId} className="text-muted-foreground text-xs">
            {resolvedHint}
          </p>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
