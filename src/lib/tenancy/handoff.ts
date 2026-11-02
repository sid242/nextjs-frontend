import { normalizeHost } from "./host";

export interface InitiateHandoffParams {
  tenantId: string;
  targetHost: string;
  next?: string;
}

/**
 * Sets workspace context cookie for legacy redirects.
 */
export function setWorkspaceContextCookie(slug: string): void {
  if (typeof document === "undefined" || !slug) return;
  document.cookie = `ctx_slug=${encodeURIComponent(slug)}; path=/; max-age=2592000; SameSite=Lax`;
}

/**
 * Initiates a cross-domain session handoff via the BFF handoff-start endpoint.
 * Returns the target handoff URL or null if failed.
 */
export async function initiateSessionHandoff({
  tenantId,
  targetHost,
  next,
}: InitiateHandoffParams): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/handoff-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        targetHost,
        next,
      }),
    });
    const data = await res?.json?.().catch(() => null);
    return res?.ok && data?.handoffUrl ? (data.handoffUrl as string) : null;
  } catch {
    return null;
  }
}

/**
 * Shared helper to navigate to workspace on same host or initiate cross-domain handoff.
 */
export async function switchWorkspaceOrHandoff({
  tenant,
  currentHost,
  next,
  onLocalNavigate,
}: {
  tenant: { id: string; slug: string };
  currentHost?: string;
  next?: string;
  onLocalNavigate?: (destination: string) => void;
}): Promise<void> {
  const host = normalizeHost(
    currentHost ?? (typeof window !== "undefined" ? window?.location?.host : ""),
  );
  const destination = next || `/w/${tenant?.slug}/dashboard`;

  if (tenant?.slug) {
    setWorkspaceContextCookie(tenant.slug);
  }

  const handoffUrl = await initiateSessionHandoff({
    tenantId: tenant?.id,
    targetHost: host,
    next: destination,
  });

  if (handoffUrl && typeof window !== "undefined") {
    try {
      const targetUrl = new URL(handoffUrl);
      const targetHost = normalizeHost(targetUrl?.host);
      if (targetHost && targetHost !== host) {
        window.location.href = handoffUrl;
        return;
      }
    } catch {
      /* ignore URL parsing failure */
    }
  }

  onLocalNavigate?.(destination);
}
