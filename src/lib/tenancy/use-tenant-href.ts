"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";

import { useTenantUrl } from "./context";
import { tenantHref } from "./urls";

export function useTenantHref(): (path?: string) => string {
  const ctx = useTenantUrl();
  const params = useParams();
  const slugFromParam = typeof params?.tenantSlug === "string" ? params.tenantSlug : undefined;
  const activeSlug = ctx?.slug ?? slugFromParam;
  const mode = ctx?.mode ?? (slugFromParam ? "path" : undefined);

  return useCallback(
    (path = "/dashboard") => {
      if (ctx) {
        return tenantHref(ctx, path);
      }
      if (activeSlug) {
        return tenantHref(
          {
            slug: activeSlug,
            mode: mode ?? "path",
            canonicalBase: "",
          },
          path,
        );
      }
      return path;
    },
    [ctx, activeSlug, mode],
  );
}
