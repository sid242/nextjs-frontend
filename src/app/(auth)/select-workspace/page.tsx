"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  Building2Icon,
  Loader2Icon,
  PlusIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_ROUTES } from "@/config/routes";
import { useTenants, type Tenant } from "@/features/tenants";
import { resetAllStores } from "@/lib/stores/reset";
import { switchWorkspaceOrHandoff } from "@/lib/tenancy/handoff";

export default function SelectWorkspacePage() {
  const { data: tenants, isLoading } = useTenants();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = async (tenant: Tenant) => {
    if (!tenant?.id) return;
    setSelectedId(tenant.id);
    try {
      await switchWorkspaceOrHandoff({
        tenant,
        onLocalNavigate: (destination) => {
          resetAllStores();
          window.location.replace(destination);
        },
      });
    } catch {
      toast.error("Could not open the workspace. Try again.");
    } finally {
      setSelectedId(null);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-3 flex size-12 items-center justify-center rounded-xl">
            <Building2Icon className="size-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Select Workspace</CardTitle>
          <CardDescription>Choose which workspace you want to open to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
              <Loader2Icon className="text-primary size-8 animate-spin" />
              <p className="mt-3 text-sm">Loading your workspaces…</p>
            </div>
          ) : tenants && (tenants?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              {tenants?.map?.((tenant) => {
                const isSelected = selectedId === tenant?.id;
                return (
                  <button
                    key={tenant?.id}
                    type="button"
                    disabled={Boolean(selectedId)}
                    onClick={() => handleSelect(tenant)}
                    className="hover:bg-muted/60 flex w-full items-center justify-between rounded-lg border p-4 text-left transition disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-lg font-semibold uppercase">
                        {tenant?.name?.slice?.(0, 2) ?? "WS"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-medium">{tenant?.name}</span>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {tenant?.plan}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs">/w/{tenant?.slug}</p>
                      </div>
                    </div>
                    {isSelected ? (
                      <Loader2Icon className="text-primary size-5 animate-spin" />
                    ) : (
                      <ArrowRightIcon className="text-muted-foreground size-5" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 py-6 text-center text-sm">
              <p className="text-muted-foreground">
                You do not have access to any customer workspaces yet.
              </p>
              <div className="border-primary/20 bg-primary/5 rounded-xl border p-4 text-left">
                <div className="text-foreground flex items-center gap-2 text-xs font-semibold">
                  <ShieldCheckIcon className="text-primary size-4" />
                  Are you an internal Platform Staff member?
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Platform staff and Super Admins manage infrastructure, subscriptions, and audited
                  tenant support sessions through the dedicated Platform Console.
                </p>
                <Button variant="default" size="sm" className="mt-3 w-full gap-2" asChild>
                  <Link href={PLATFORM_ROUTES.ROOT}>
                    <ShieldCheckIcon className="size-3.5" />
                    Go to Platform Console
                  </Link>
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <Button variant="outline" asChild size="sm">
              <Link href="/onboarding/create-workspace">
                <PlusIcon className="mr-2 size-4" />
                New Workspace
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/api/auth/logout">Sign Out</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
