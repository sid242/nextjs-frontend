import "server-only";

import { backendFetch } from "@/lib/server/backend";

export interface ResolvedTenantBranding {
  companyName?: string | null;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  borderRadius?: string | null;
  customDomain?: string | null;
  supportEmail?: string | null;
  [key: string]: unknown;
}

export interface PublicTenantResolution {
  kind: "platform" | "tenant";
  tenantId?: string;
  slug?: string;
  name?: string;
  status?: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  pathOnly?: boolean;
  canonicalBase: string;
  urlMode?: "path" | "subdomain" | "customDomain";
  allowed?: {
    path: true;
    subdomain: boolean;
    customDomain: boolean;
  };
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  branding?: ResolvedTenantBranding;
}

interface CacheEntry {
  data: PublicTenantResolution | null;
  expiresAt: number;
}

const CACHE_MAX_SIZE = 500;
const CACHE_TTL_MS = 60 * 1000; // 60s
const NEGATIVE_CACHE_TTL_MS = 10 * 1000; // 10s

const resolveCache = new Map<string, CacheEntry>();

function getFromCache(key: string): PublicTenantResolution | null | undefined {
  const entry = resolveCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    resolveCache.delete(key);
    return undefined;
  }
  return entry.data;
}

function setInCache(key: string, data: PublicTenantResolution | null, ttlMs: number) {
  if (resolveCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = resolveCache.keys().next().value;
    if (oldestKey) resolveCache.delete(oldestKey);
  }
  resolveCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function clearResolveCache(): void {
  resolveCache.clear();
}

/**
 * Resolves tenant or platform by host with in-memory caching.
 */
export async function resolveTenantByHost(host: string): Promise<PublicTenantResolution | null> {
  const cleanHost = host.trim().toLowerCase().split(":")[0] ?? host.trim().toLowerCase();
  if (!cleanHost) return null;

  const cacheKey = `host:${cleanHost}`;
  const cached = getFromCache(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const res = await backendFetch("/tenants/public/resolve", {
      search: `?host=${encodeURIComponent(cleanHost)}`,
    });

    if (!res.ok) {
      setInCache(cacheKey, null, NEGATIVE_CACHE_TTL_MS);
      return null;
    }

    const json = (await res.json()) as { success: boolean; data?: PublicTenantResolution };
    const data = json?.data ?? null;

    setInCache(cacheKey, data, data ? CACHE_TTL_MS : NEGATIVE_CACHE_TTL_MS);
    return data;
  } catch {
    setInCache(cacheKey, null, NEGATIVE_CACHE_TTL_MS);
    return null;
  }
}

/**
 * Resolves tenant by slug with in-memory caching.
 */
export async function resolveTenantBySlug(slug: string): Promise<PublicTenantResolution | null> {
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug) return null;

  const cacheKey = `slug:${cleanSlug}`;
  const cached = getFromCache(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const res = await backendFetch("/tenants/public/resolve", {
      search: `?slug=${encodeURIComponent(cleanSlug)}`,
    });

    if (!res.ok) {
      setInCache(cacheKey, null, NEGATIVE_CACHE_TTL_MS);
      return null;
    }

    const json = (await res.json()) as { success: boolean; data?: PublicTenantResolution };
    const data = json?.data ?? null;

    setInCache(cacheKey, data, data ? CACHE_TTL_MS : NEGATIVE_CACHE_TTL_MS);
    return data;
  } catch {
    setInCache(cacheKey, null, NEGATIVE_CACHE_TTL_MS);
    return null;
  }
}
