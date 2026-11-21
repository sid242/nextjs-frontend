import type { SupportedLocale, TranslationSchema } from "../types";
import { en } from "./en";
import { hi } from "./hi";

export const dictionaries: Record<SupportedLocale, TranslationSchema> = {
  en,
  hi,
};

export { en, hi };
