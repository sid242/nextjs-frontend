import { describe, expect, it } from "vitest";

import { dictionaries, en } from "./dictionaries";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "./types";

function getAllKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys = keys.concat(getAllKeys(v as Record<string, unknown>, currentPath));
    } else {
      keys.push(currentPath);
    }
  }
  return keys;
}

function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object" || !(p in cur)) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

describe("i18n Translation Dictionary Integrity", () => {
  const enKeys = getAllKeys(en as unknown as Record<string, unknown>);

  it("has a non-empty English reference dictionary", () => {
    expect(enKeys.length).toBeGreaterThan(40);
  });

  const otherLocales: SupportedLocale[] = ["hi"];

  for (const loc of otherLocales) {
    it(`locale '${loc}' must implement all keys present in reference 'en' dictionary with non-empty values`, () => {
      const dict = dictionaries[loc];
      expect(dict).toBeDefined();

      const missingKeys: string[] = [];
      const emptyKeys: string[] = [];

      for (const key of enKeys) {
        const val = getNestedValue(dict, key);
        if (val === undefined) {
          missingKeys.push(key);
        } else if (typeof val !== "string" || val.trim() === "") {
          emptyKeys.push(key);
        }
      }

      expect(missingKeys, `Missing keys in locale '${loc}': ${missingKeys.join(", ")}`).toEqual([]);
      expect(emptyKeys, `Empty keys in locale '${loc}': ${emptyKeys.join(", ")}`).toEqual([]);
    });
  }

  it("verifies all parameters present in 'en' strings are preserved in translations", () => {
    const paramRegex = /{([a-zA-Z0-9_]+)}/g;

    for (const key of enKeys) {
      const enVal = getNestedValue(en, key) as string;
      const enParams = Array.from(enVal.matchAll(paramRegex)).map((m) => m[1]);

      if (enParams.length > 0) {
        for (const loc of otherLocales) {
          const locVal = getNestedValue(dictionaries[loc], key) as string;
          for (const param of enParams) {
            expect(
              locVal,
              `Parameter '{${param}}' from 'en.${key}' missing in '${loc}.${key}'`,
            ).toContain(`{${param}}`);
          }
        }
      }
    }
  });

  it("checks supported locales metadata consistency", () => {
    expect(SUPPORTED_LOCALES.length).toBe(2);
    const codes = SUPPORTED_LOCALES.map((l) => l.code);
    expect(codes).toContain("en");
    expect(codes).toContain("hi");
    expect(DEFAULT_LOCALE).toBe("en");
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("hi")).toBe(true);
    expect(isSupportedLocale("xx")).toBe(false);
    expect(isSupportedLocale(null)).toBe(false);
  });
});
