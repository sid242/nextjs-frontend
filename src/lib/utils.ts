import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateSlug = (value: string): string => {
  return (
    value
      ?.toLowerCase()
      ?.replace(/[^a-z0-9\s-/]/g, "") // Remove special characters except spaces, dashes, slashes
      ?.trim()
      ?.replace(/[\s/-]+/g, "-") // Replace spaces, slashes, and multiple dashes with a single dash
      ?.replace(/^-+|-+$/g, "") || ""
  ); // Remove leading and trailing dashes
};

export const slugify = generateSlug;
