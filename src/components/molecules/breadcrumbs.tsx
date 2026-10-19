"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, HomeIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  team: "Team",
  roles: "Roles & Permissions",
  branding: "White-Label Branding",
  settings: "Settings",
  smtp: "SMTP Configuration",
  files: "Files",
  "audit-logs": "Audit Logs",
};

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("hidden items-center gap-1.5 text-sm sm:flex", className)}
    >
      <Link
        href="/dashboard"
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
      >
        <HomeIcon className="size-3.5" />
        <span className="sr-only">Dashboard</span>
      </Link>

      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = ROUTE_LABELS[segment] ?? segment.replace(/-/g, " ");

        return (
          <div key={href} className="flex items-center gap-1.5">
            <ChevronRightIcon className="text-muted-foreground/60 size-3.5 shrink-0" />
            {isLast ? (
              <span className="text-foreground font-medium capitalize" aria-current="page">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="text-muted-foreground hover:text-foreground capitalize transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
