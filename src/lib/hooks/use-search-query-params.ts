"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface SearchQueryNavigateOptions {
  /**
   * Navigation mode: "replace" replaces the current history entry, while "push" adds a new one.
   * @default "replace"
   */
  mode?: "replace" | "push";
  /**
   * Whether to scroll to the top of the page upon navigation.
   * @default false
   */
  scroll?: boolean;
}

export type QueryParamValue = string | number | boolean | null | undefined;
export type QueryParamsRecord = Record<string, QueryParamValue | QueryParamValue[]>;

export interface UseSearchQueryParamsReturn {
  /** The native Next.js readonly URLSearchParams instance */
  searchParams: ReturnType<typeof useSearchParams>;
  /** Current URL pathname without query parameters */
  pathname: string;
  /** Get single string value for a parameter */
  get: (name: string) => string | null;
  /** Get all values for a repeated parameter (e.g. ?tag=a&tag=b) */
  getAll: (name: string) => string[];
  /** Get parameter parsed as a number, or fallback if missing / invalid */
  getNumber: (name: string, fallback?: number) => number | undefined;
  /** Get parameter parsed as a boolean, or fallback if missing / invalid */
  getBoolean: (name: string, fallback?: boolean) => boolean | undefined;
  /** Check if a query parameter exists in the URL */
  has: (name: string) => boolean;
  /** Convert all current query parameters into a plain JavaScript dictionary */
  toObject: () => Record<string, string | string[]>;
  /** Update or remove a single query parameter and navigate */
  setParam: (name: string, value: QueryParamValue, options?: SearchQueryNavigateOptions) => void;
  /** Batch update multiple query parameters and navigate */
  setParams: (updates: QueryParamsRecord, options?: SearchQueryNavigateOptions) => void;
  /** Delete one or more query parameters and navigate */
  deleteParam: (name: string | string[], options?: SearchQueryNavigateOptions) => void;
  /** Clear all query parameters and navigate to the clean pathname */
  clearParams: (options?: SearchQueryNavigateOptions) => void;
  /** Construct an updated URL string without navigating (ideal for Next.js <Link href={...}>) */
  createUrl: (updates?: QueryParamsRecord) => string;
}

/** Parses string parameter to a finite number, or returns the fallback value. */
export function parseQueryNumber(
  val: string | null | undefined,
  fallback?: number,
): number | undefined {
  if (val === null || val === undefined || val === "") return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

/** Parses string parameter into a boolean flag ("true", "1", "yes" vs "false", "0", "no"). */
export function parseQueryBoolean(
  val: string | null | undefined,
  fallback?: boolean,
): boolean | undefined {
  if (val === null || val === undefined) return fallback;
  const lower = val.toLowerCase().trim();
  if (lower === "true" || lower === "1" || lower === "yes") return true;
  if (lower === "false" || lower === "0" || lower === "no") return false;
  return fallback;
}

/** Converts URLSearchParams into a typed dictionary supporting arrays for repeated keys. */
export function toQueryObject(
  params: URLSearchParams | { keys: () => Iterable<string>; getAll: (k: string) => string[] },
): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  if (!params) return result;

  for (const key of params.keys()) {
    const all = params.getAll(key);
    if (all.length > 1) {
      result[key] = all;
    } else if (all.length === 1) {
      result[key] = all[0] ?? "";
    }
  }
  return result;
}

/** Applies batch updates to a URLSearchParams instance, removing nullish/empty values. */
export function applyQueryUpdates(params: URLSearchParams, updates?: QueryParamsRecord): void {
  if (!updates) return;
  for (const [key, val] of Object.entries(updates)) {
    if (val === null || val === undefined || val === "") {
      params.delete(key);
    } else if (Array.isArray(val)) {
      params.delete(key);
      for (const item of val) {
        if (item !== null && item !== undefined && item !== "") {
          params.append(key, String(item));
        }
      }
    } else {
      params.set(key, String(val));
    }
  }
}

/** Constructs an updated pathname + query string from existing params and updates. */
export function buildQueryUrl(
  pathname: string,
  currentParams: URLSearchParams | string = "",
  updates?: QueryParamsRecord,
): string {
  const params =
    typeof currentParams === "string"
      ? new URLSearchParams(currentParams)
      : new URLSearchParams(currentParams.toString());

  applyQueryUpdates(params, updates);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * Custom hook to read, manipulate, batch update, and navigate URL search parameters
 * in Next.js App Router client components.
 */
export function useSearchQueryParams(): UseSearchQueryParamsReturn {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const get = useCallback(
    (name: string): string | null => searchParams?.get(name) ?? null,
    [searchParams],
  );

  const getAll = useCallback(
    (name: string): string[] => searchParams?.getAll(name) ?? [],
    [searchParams],
  );

  const getNumber = useCallback(
    (name: string, fallback?: number): number | undefined =>
      parseQueryNumber(searchParams?.get(name), fallback),
    [searchParams],
  );

  const getBoolean = useCallback(
    (name: string, fallback?: boolean): boolean | undefined =>
      parseQueryBoolean(searchParams?.get(name), fallback),
    [searchParams],
  );

  const has = useCallback(
    (name: string): boolean => searchParams?.has(name) ?? false,
    [searchParams],
  );

  const toObject = useCallback((): Record<string, string | string[]> => {
    if (!searchParams) return {};
    return toQueryObject(searchParams);
  }, [searchParams]);

  const createUrl = useCallback(
    (updates?: QueryParamsRecord): string =>
      buildQueryUrl(pathname, searchParams?.toString() ?? "", updates),
    [pathname, searchParams],
  );

  const navigate = useCallback(
    (url: string, options?: SearchQueryNavigateOptions) => {
      const mode = options?.mode ?? "replace";
      const scroll = options?.scroll ?? false;
      if (mode === "push") {
        router.push(url, { scroll });
      } else {
        router.replace(url, { scroll });
      }
    },
    [router],
  );

  const setParam = useCallback(
    (name: string, value: QueryParamValue, options?: SearchQueryNavigateOptions) => {
      const nextUrl = createUrl({ [name]: value });
      navigate(nextUrl, options);
    },
    [createUrl, navigate],
  );

  const setParams = useCallback(
    (updates: QueryParamsRecord, options?: SearchQueryNavigateOptions) => {
      const nextUrl = createUrl(updates);
      navigate(nextUrl, options);
    },
    [createUrl, navigate],
  );

  const deleteParam = useCallback(
    (name: string | string[], options?: SearchQueryNavigateOptions) => {
      const names = Array.isArray(name) ? name : [name];
      const updates: QueryParamsRecord = {};
      for (const n of names) {
        updates[n] = null;
      }
      const nextUrl = createUrl(updates);
      navigate(nextUrl, options);
    },
    [createUrl, navigate],
  );

  const clearParams = useCallback(
    (options?: SearchQueryNavigateOptions) => {
      navigate(pathname, options);
    },
    [navigate, pathname],
  );

  return {
    searchParams,
    pathname,
    get,
    getAll,
    getNumber,
    getBoolean,
    has,
    toObject,
    setParam,
    setParams,
    deleteParam,
    clearParams,
    createUrl,
  };
}
