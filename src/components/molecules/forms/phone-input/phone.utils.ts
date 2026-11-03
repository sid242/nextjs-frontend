import { COUNTRY_DIAL_OPTIONS, DEFAULT_COUNTRY_CODE } from "./phone.constants";

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
