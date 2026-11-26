"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api } from "@/lib/api/http";

import { dictionaries, en } from "./dictionaries";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  SUPPORTED_LOCALES,
  type LocaleInfo,
  type SupportedLocale,
  type TranslationSchema,
} from "./types";

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale, syncWithProfile?: boolean) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  locales: LocaleInfo[];
  currentLocaleInfo: LocaleInfo;
  isRTL: boolean;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatMoney: (amount: number, currency?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "app_locale";
const COOKIE_KEY = "app_locale";

function getInitialLocale(): SupportedLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  try {
    // 1. Cookie is single source of truth (aligns client and SSR)
    const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
    const cookieVal = cookieMatch ? decodeURIComponent(cookieMatch[1] ?? "") : null;
    if (cookieVal && isSupportedLocale(cookieVal)) return cookieVal;

    // 2. localStorage fallback
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isSupportedLocale(saved)) return saved;

    // 3. Browser navigator language
    const navLang = navigator.language?.split("-")[0]?.toLowerCase();
    if (navLang && isSupportedLocale(navLang)) return navLang;
  } catch {
    // ignore
  }

  return DEFAULT_LOCALE;
}

export function resolveNestedKey(obj: unknown, path: string): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: SupportedLocale;
}) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    return initialLocale ?? getInitialLocale();
  });

  const currentLocaleInfo = useMemo(() => {
    return SUPPORTED_LOCALES.find((l) => l.code === locale) ?? SUPPORTED_LOCALES[0]!;
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const isHttps = window.location.protocol === "https:";
      const secureFlag = isHttps ? "; Secure" : "";
      localStorage.setItem(STORAGE_KEY, locale);
      document.cookie = `${COOKIE_KEY}=${locale}; path=/; max-age=31536000; SameSite=Lax${secureFlag}`;
      document.documentElement.lang = locale;
      document.documentElement.dir = currentLocaleInfo.dir;
    } catch {
      // ignore
    }
  }, [locale, currentLocaleInfo.dir]);

  const setLocale = useCallback((newLocale: SupportedLocale, syncWithProfile = false) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      try {
        const isHttps = window.location.protocol === "https:";
        const secureFlag = isHttps ? "; Secure" : "";
        localStorage.setItem(STORAGE_KEY, newLocale);
        document.cookie = `${COOKIE_KEY}=${newLocale}; path=/; max-age=31536000; SameSite=Lax${secureFlag}`;
        document.documentElement.lang = newLocale;
        const locInfo = SUPPORTED_LOCALES.find((l) => l.code === newLocale);
        if (locInfo) document.documentElement.dir = locInfo.dir;
      } catch {
        // ignore
      }
    }
    if (syncWithProfile && typeof window !== "undefined") {
      try {
        void api.patch("/users/me", { locale: newLocale }).catch(() => {
          // best-effort sync
        });
      } catch {
        // ignore
      }
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const activeDict: TranslationSchema = dictionaries[locale] ?? en;
      let text = resolveNestedKey(activeDict, key);

      // Fallback to English dictionary if key not found in active locale
      if (text === undefined && locale !== "en") {
        text = resolveNestedKey(en, key);
      }

      // If still not found, return key and warn in dev
      if (text === undefined) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[i18n] Missing translation key: "${key}" in locale: "${locale}"`);
        }
        return key;
      }

      // Interpolate parameters like {name}, {count}
      if (params) {
        text = text.replace(/{(\w+)}/g, (match, paramKey: string) => {
          const val = params[paramKey];
          return val !== undefined ? String(val) : match;
        });
      }

      return text;
    },
    [locale],
  );

  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
      try {
        const d = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat(locale, options).format(d);
      } catch {
        return String(date);
      }
    },
    [locale],
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions): string => {
      try {
        return new Intl.NumberFormat(locale, options).format(value);
      } catch {
        return String(value);
      }
    },
    [locale],
  );

  const formatMoney = useCallback(
    (amount: number, currency = "USD"): string => {
      try {
        return new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-US", {
          style: "currency",
          currency,
        }).format(amount);
      } catch {
        return `${currency} ${amount}`;
      }
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      locales: SUPPORTED_LOCALES,
      currentLocaleInfo,
      isRTL: currentLocaleInfo.dir === "rtl",
      formatDate,
      formatNumber,
      formatMoney,
    }),
    [locale, setLocale, t, currentLocaleInfo, formatDate, formatNumber, formatMoney],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
