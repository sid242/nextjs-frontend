export interface CountryDialOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  placeholder?: string;
}

export const DEFAULT_COUNTRY_CODE = "IN";

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
  defaultCountryCode = DEFAULT_COUNTRY_CODE,
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
