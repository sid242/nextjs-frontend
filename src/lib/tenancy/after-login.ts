import { safeNextPath } from "@/lib/auth/paths";

import { initiateSessionHandoff } from "./handoff";
import { classifyHost, normalizeHost } from "./host";

export interface UserMembershipSummary {
  tenantId: string;
  slug: string;
  name: string;
  canonicalBase: string;
  status: string;
}

export type AfterLoginResult =
  | { type: "navigate"; path: string }
  | { type: "handoff"; tenantId: string; targetHost: string; next?: string };

/**
 * Extracts hostname safely from a canonical base URL.
 */
const getHostFromBase = (canonicalBase?: string | null): string => {
  if (!canonicalBase) return "";
  try {
    const url = new URL(canonicalBase);
    return normalizeHost(url?.host);
  } catch {
    return "";
  }
};

/**
 * Resolves whether to navigate locally or trigger cross-domain session handoff for a given membership.
 */
function resolveMembershipDestination(
  membership: UserMembershipSummary,
  cleanHost: string,
  isPlatform: boolean,
  requestedNext?: string | null,
): AfterLoginResult {
  const targetHost = getHostFromBase(membership?.canonicalBase);
  const isDev = process.env.NODE_ENV !== "production";
  const isLocalDevHost =
    cleanHost === "localhost" ||
    cleanHost === "127.0.0.1" ||
    /^(?:192\.168\.|10\.|172\.(?:1[6-9]|2[0-9]|3[0-1])\.)\d+/.test(cleanHost) ||
    cleanHost.endsWith(".devtunnels.ms") ||
    cleanHost.endsWith(".ngrok-free.app") ||
    cleanHost.endsWith(".ngrok.io") ||
    cleanHost.endsWith(".loca.lt");

  const isSameHost =
    !targetHost ||
    targetHost === cleanHost ||
    (isDev &&
      isLocalDevHost &&
      (targetHost === "localhost" ||
        targetHost === "127.0.0.1" ||
        targetHost.endsWith(".localhost") ||
        isLocalDevHost));

  if (isSameHost) {
    if (requestedNext && requestedNext.startsWith(`/w/${membership?.slug}`)) {
      return { type: "navigate", path: safeNextPath(requestedNext) };
    }
    const defaultPath = isPlatform ? `/w/${membership?.slug}/dashboard` : "/dashboard";
    return { type: "navigate", path: defaultPath };
  }

  return {
    type: "handoff",
    tenantId: membership?.tenantId,
    targetHost,
    next: requestedNext ? safeNextPath(requestedNext) : "/dashboard",
  };
}

export function routeAfterLogin(
  memberships: UserMembershipSummary[] | undefined | null,
  currentHost: string,
  requestedNext?: string | null,
): AfterLoginResult {
  const activeMemberships = (memberships ?? []).filter(
    (m) => m?.status === "ACTIVE" || m?.status === "TRIALING",
  );

  const cleanHost = normalizeHost(currentHost);
  const hostInfo = classifyHost(cleanHost);
  const isPlatform = hostInfo?.classification === "platform";

  // Case 1: 0 memberships
  if (!activeMemberships || (activeMemberships?.length ?? 0) === 0) {
    return { type: "navigate", path: "/select-workspace" };
  }

  // Case 2: exactly 1 membership
  if (activeMemberships?.length === 1) {
    const single = activeMemberships?.[0];
    if (!single) return { type: "navigate", path: "/select-workspace" };
    return resolveMembershipDestination(single, cleanHost, isPlatform, requestedNext);
  }

  // Case 3: >= 2 memberships
  // If on a domain host (subdomain / custom), check if this domain corresponds to one of the user's memberships
  if (!isPlatform) {
    const matchingTenant = activeMemberships?.find(
      (m) => getHostFromBase(m?.canonicalBase) === cleanHost,
    );
    if (matchingTenant) {
      return {
        type: "navigate",
        path: requestedNext ? safeNextPath(requestedNext) : "/dashboard",
      };
    }
    return { type: "navigate", path: "/select-workspace" };
  }

  // On platform host with multiple memberships
  if (requestedNext && requestedNext.startsWith("/w/")) {
    const parts = requestedNext.split("/");
    const slug = parts?.[2];
    const match = activeMemberships?.find((m) => m?.slug === slug);
    if (match) {
      return resolveMembershipDestination(match, cleanHost, isPlatform, requestedNext);
    }
  }

  return { type: "navigate", path: "/select-workspace" };
}

/**
 * Executes post-login navigation or session handoff across domains.
 */
export async function executePostLoginRouting(
  result: AfterLoginResult,
  router: { replace: (url: string) => void; refresh?: () => void },
): Promise<void> {
  if (result?.type === "navigate") {
    if (typeof window !== "undefined") {
      window.location.assign(result.path);
      return;
    }
    router?.replace?.(result?.path);
    router?.refresh?.();
    return;
  }

  // Handoff required
  const handoffUrl = await initiateSessionHandoff({
    tenantId: result?.tenantId,
    targetHost: result?.targetHost,
    next: result?.next,
  });

  if (handoffUrl && typeof window !== "undefined") {
    window.location.href = handoffUrl;
    return;
  }

  router?.replace?.(result?.next || "/select-workspace");
}
