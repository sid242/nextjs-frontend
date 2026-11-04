export interface BuildQueryParamsOptions {
  /** Field keys where numeric 0 is considered a valid value instead of falsy */
  includeZeroFields?: string[];
  /** Sentinel values to exclude (e.g. ['all', 'ALL']) */
  excludeValues?: unknown[];
  /** How to format arrays: 'repeat' (key=val1&key=val2) or 'comma' (key=val1,val2). Default: 'repeat' */
  arrayFormat?: "repeat" | "comma";
}

/**
 * Builds a URL query parameter string from a record of key-value pairs.
 * Filters out undefined, null, empty strings, and 0 (unless explicitly allowed).
 * Safely handles arrays, booleans, numbers, and sentinel values.
 *
 * @param data - The object containing query parameters
 * @param includeZeroFieldsOrOptions - Either an array of keys allowing 0, or full options
 */
export const buildQueryParams = <T extends object>(
  data?: T | Record<string, unknown> | null,
  includeZeroFieldsOrOptions: string[] | BuildQueryParamsOptions = [],
): string => {
  if (!data || typeof data !== "object") {
    return "";
  }

  const options: BuildQueryParamsOptions = Array.isArray(includeZeroFieldsOrOptions)
    ? { includeZeroFields: includeZeroFieldsOrOptions }
    : includeZeroFieldsOrOptions;

  const includeZeroFields = options.includeZeroFields ?? [];
  const excludeValues = options.excludeValues ?? ["all", "ALL"];
  const arrayFormat = options.arrayFormat ?? "repeat";

  const params = new URLSearchParams();
  const record = data as Record<string, unknown>;

  for (const key in record) {
    if (Object.hasOwn(record, key)) {
      const value = record[key];

      if (value === undefined || value === null) {
        continue;
      }

      if (typeof value === "number" && Number.isNaN(value)) {
        continue;
      }

      const isZeroAllowed = includeZeroFields.includes(key);

      if (value === 0 && !isZeroAllowed) {
        continue;
      }

      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "") {
          continue;
        }
        if (
          excludeValues.some(
            (ex) => typeof ex === "string" && ex.toLowerCase() === trimmed.toLowerCase(),
          )
        ) {
          continue;
        }
        params.append(key, trimmed);
        continue;
      }

      if (Array.isArray(value)) {
        if (value.length === 0) continue;
        const validItems = value
          .map((item) => (typeof item === "string" ? item.trim() : item))
          .filter(
            (item) =>
              item !== undefined &&
              item !== null &&
              item !== "" &&
              !excludeValues.some(
                (ex) =>
                  typeof ex === "string" &&
                  typeof item === "string" &&
                  ex.toLowerCase() === item.toLowerCase(),
              ),
          );

        if (validItems.length === 0) continue;

        if (arrayFormat === "comma") {
          params.append(key, validItems.join(","));
        } else {
          for (const item of validItems) {
            params.append(key, String(item));
          }
        }
        continue;
      }

      if (typeof value === "boolean") {
        params.append(key, String(value));
        continue;
      }

      if (typeof value === "number") {
        params.append(key, String(value));
        continue;
      }

      const strVal = String(value);
      if (strVal && !excludeValues.includes(strVal)) {
        params.append(key, strVal);
      }
    }
  }

  return params.toString();
};

/**
 * Builds a query string with a leading '?' if non-empty, otherwise returns an empty string.
 */
export const buildQueryString = <T extends object>(
  data?: T | Record<string, unknown> | null,
  includeZeroFieldsOrOptions: string[] | BuildQueryParamsOptions = [],
): string => {
  const qs = buildQueryParams(data, includeZeroFieldsOrOptions);
  return qs ? `?${qs}` : "";
};
