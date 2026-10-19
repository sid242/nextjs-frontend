"use client";

import Link from "next/link";
import { Building2Icon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useActiveTenant, useTenantBranding } from "../queries";

interface TenantBrandProps {
  className?: string;
  showIconOnly?: boolean;
}

export function TenantBrand({ className, showIconOnly = false }: TenantBrandProps) {
  const { activeTenant } = useActiveTenant();
  const { data: branding } = useTenantBranding(activeTenant?.id);

  const displayName = branding?.companyName || activeTenant?.name || "Foundation";

  return (
    <Link
      href="/dashboard"
      className={cn(
        "flex items-center gap-2.5 font-semibold tracking-tight transition-opacity hover:opacity-85",
        className,
      )}
    >
      <Avatar className="bg-primary text-primary-foreground size-7 shrink-0 rounded-md shadow-xs">
        <AvatarFallback className="rounded-md text-xs font-bold">
          {displayName ? initials(displayName) : <Building2Icon className="size-3.5" />}
        </AvatarFallback>
      </Avatar>

      {!showIconOnly && (
        <div className="flex items-center gap-2">
          <span className="text-foreground truncate text-sm font-bold tracking-tight sm:text-base">
            {displayName}
          </span>
        </div>
      )}
    </Link>
  );
}
