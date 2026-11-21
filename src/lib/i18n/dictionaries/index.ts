import type { SupportedLocale, TranslationSchema } from "../types";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { hi } from "./hi";

export const dictionaries: Record<SupportedLocale, TranslationSchema> = {
  en,
  es,
  hi,
  fr,
};

export { en, es, hi, fr };
