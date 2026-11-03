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
