"use client";

import { useCallback } from "react";
import { useParams, usePathname } from "next/navigation";

import { tenantSlugFromPath } from "@/lib/auth/paths";

import { useTenantUrl } from "./context";
import { tenantHref } from "./urls";

export function useTenantHref(): (path?: string) => string {
  const ctx = useTenantUrl();
  const params = useParams();
  const pathname = usePathname();
  const slugFromParam = typeof params?.tenantSlug === "string" ? params.tenantSlug : undefined;
  const slugFromPath = pathname ? tenantSlugFromPath(pathname) : null;
  const activeSlug = ctx?.slug ?? slugFromParam ?? slugFromPath ?? undefined;
  const mode = ctx?.mode ?? (slugFromParam || slugFromPath ? "path" : undefined);

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
