"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, HomeIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  groups: "User Groups",
  team: "Team",
  roles: "Roles & Permissions",
  branding: "White-Label Branding",
  settings: "Settings",
  smtp: "SMTP Configuration",
  files: "Files",
  "audit-logs": "Audit Logs",
  "email-templates": "Email Templates",
  billing: "Billing & Plans",
  plans: "Plans",
  tenants: "Tenants",
  users: "Users",
  staff: "Platform Staff",
  profile: "Profile",
  security: "Security",
  "support-sessions": "Support Sessions",
  workspace: "Workspace Settings",
  url: "Custom Domain & URL",
  new: "Create",
  edit: "Edit",
  pricing: "Pricing",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LONG_ID_REGEX = /^[0-9a-zA-Z_-]{20,}$/;

function isIdSegment(segment: string): boolean {
  return UUID_REGEX.test(segment) || LONG_ID_REGEX.test(segment);
}

export function parseBreadcrumbs(pathname: string | null | undefined): {
  homeHref: string;
  homeLabel: string;
  crumbs: Array<{ href: string; label: string; isLast: boolean }>;
} {
  if (!pathname) {
    return { homeHref: "/dashboard", homeLabel: "Dashboard", crumbs: [] };
  }

  const rawSegments = pathname.split("/").filter(Boolean);
  if (rawSegments.length === 0) {
    return { homeHref: "/dashboard", homeLabel: "Dashboard", crumbs: [] };
  }

  let basePath = "";
  let homeHref = "/dashboard";
  let homeLabel = "Dashboard";
  let displaySegments: string[] = [];

  // 1. Path-based tenant: /w/[tenantSlug]/...
  if (rawSegments[0] === "w" && rawSegments[1]) {
    basePath = `/w/${rawSegments[1]}`;
    homeHref = `${basePath}/dashboard`;
    homeLabel = "Workspace Dashboard";
    displaySegments = rawSegments.slice(2);
  }
  // 2. Platform portal: /platform/...
  else if (rawSegments[0] === "platform") {
    basePath = "/platform";
    homeHref = "/platform/dashboard";
    homeLabel = "Platform Dashboard";
    displaySegments = rawSegments.slice(1);
  }
  // 3. Root app
  else {
    basePath = "";
    homeHref = "/dashboard";
    homeLabel = "Dashboard";
    displaySegments = rawSegments;
  }

  const crumbs = displaySegments.map((segment, index) => {
    const isLast = index === displaySegments.length - 1;
    const pathUntilNow = displaySegments.slice(0, index + 1).join("/");
    const href = basePath ? `${basePath}/${pathUntilNow}` : `/${pathUntilNow}`;

    let label: string;
    if (ROUTE_LABELS[segment]) {
      label = ROUTE_LABELS[segment];
    } else if (isIdSegment(segment)) {
      label = "Details";
    } else {
      label = segment.replace(/-/g, " ");
    }

    return {
      href,
      label,
      isLast,
    };
  });

  return { homeHref, homeLabel, crumbs };
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const { homeHref, homeLabel, crumbs } = parseBreadcrumbs(pathname);

  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("hidden items-center gap-1.5 text-sm sm:flex", className)}
    >
      <Link
        href={homeHref}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
      >
        <HomeIcon className="size-3.5" />
        <span className="sr-only">{homeLabel}</span>
      </Link>

      {crumbs.map((crumb) => (
        <div key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRightIcon className="text-muted-foreground/60 size-3.5 shrink-0" />
          {crumb.isLast ? (
            <span className="text-foreground font-medium capitalize" aria-current="page">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground hover:text-foreground capitalize transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
