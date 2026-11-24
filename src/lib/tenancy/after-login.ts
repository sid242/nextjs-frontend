import { AUTH_ROUTES, ROUTES, TENANT_PATHS } from "@/config/routes";
import { isProtectedPath, safeNextPath } from "@/lib/auth/paths";

import { initiateSessionHandoff } from "./handoff";
import { classifyHost, isIpAddress, normalizeHost } from "./host";

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
  requestedNext: URL | null,
  requestedSlug?: string,
): AfterLoginResult {
  const targetHost = getHostFromBase(membership?.canonicalBase);
  const slug = encodeURIComponent(membership.slug);
  const workspacePath = `/w/${slug}`;
  const canonicalPath =
    membership?.canonicalBase && URL.canParse(membership.canonicalBase)
      ? new URL(membership.canonicalBase).pathname.replace(/\/$/, "")
      : "";
  const isPathMode = !membership?.canonicalBase || canonicalPath === workspacePath;
  const isSameHost =
    !targetHost || targetHost === cleanHost || isIpAddress(cleanHost) || isPathMode;

  let next: string | undefined;
  if (requestedNext && isProtectedPath(requestedNext.pathname)) {
    const suffix = requestedNext.search + requestedNext.hash;
    if (requestedSlug === slug) {
      const tenantPath =
        requestedNext.pathname.slice(workspacePath.length) || TENANT_PATHS.DASHBOARD;
      next = (isPathMode || isIpAddress(cleanHost) ? workspacePath : "") + tenantPath + suffix;
    } else if (!requestedSlug && !isPlatform && targetHost === cleanHost) {
      next = requestedNext.pathname + suffix;
    }
  }

  if (isSameHost) {
    const defaultPath =
      isPathMode || isPlatform || isIpAddress(cleanHost)
        ? ROUTES.tenant(membership.slug).DASHBOARD
        : TENANT_PATHS.DASHBOARD;
    return { type: "navigate", path: next ?? defaultPath };
  }

  return {
    type: "handoff",
    tenantId: membership?.tenantId,
    targetHost: new URL(membership.canonicalBase).host,
    next: next ?? TENANT_PATHS.DASHBOARD,
  };
}

export function routeAfterLogin(
  memberships: UserMembershipSummary[] | undefined | null,
  currentHost: string,
  requestedNext?: string | null,
  preferredSlug?: string,
): AfterLoginResult {
  const activeMemberships = (memberships ?? []).filter(
    (m) => m?.status === "ACTIVE" || m?.status === "TRIALING",
  );

  const cleanHost = normalizeHost(currentHost);
  const hostInfo = classifyHost(cleanHost);
  const isPlatform = hostInfo?.classification === "platform";

  const safePath = safeNextPath(requestedNext, "");
  const base = "https://local.invalid";
  const parsedNext = safePath ? new URL(safePath, base) : null;
  const next = parsedNext?.origin === base ? parsedNext : null;
  const requestedSlug = next?.pathname.match(/^\/w\/([^/]+)/)?.[1];

  const explicit = activeMemberships.find((m) => m?.slug === preferredSlug);
  const byHost =
    !isPlatform && !isIpAddress(cleanHost)
      ? activeMemberships.find((m) => getHostFromBase(m?.canonicalBase) === cleanHost)
      : undefined;
  const byPath = activeMemberships.find((m) => encodeURIComponent(m.slug) === requestedSlug);
  const membership =
    explicit ??
    byHost ??
    byPath ??
    (activeMemberships.length === 1 ? activeMemberships[0] : undefined);

  if (!membership) return { type: "navigate", path: AUTH_ROUTES.SELECT_WORKSPACE };
  return resolveMembershipDestination(membership, cleanHost, isPlatform, next, requestedSlug);
}

/**
 * Executes post-login navigation or session handoff across domains.
 */
export async function executePostLoginRouting(
  result: AfterLoginResult,
  router: { replace: (url: string) => void; refresh?: () => void },
): Promise<void> {
  if (result?.type === "navigate") {
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

  router?.replace?.(AUTH_ROUTES.SELECT_WORKSPACE);
}
