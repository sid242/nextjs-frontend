import {
  Building2Icon,
  CheckIcon,
  FileTextIcon,
  FolderIcon,
  LayersIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { AppModule } from "../schemas";
import { ActionBadge } from "./role-card";

export function getModuleIcon(key: string) {
  switch (key?.toLowerCase()) {
    case "files":
      return <FolderIcon className="size-4 text-sky-500" />;
    case "tenants":
      return <Building2Icon className="size-4 text-indigo-500" />;
    case "members":
      return <UsersIcon className="size-4 text-emerald-500" />;
    case "rbac":
      return <ShieldIcon className="size-4 text-amber-500" />;
    case "audit":
      return <FileTextIcon className="size-4 text-purple-500" />;
    default:
      return <LayersIcon className="text-primary size-4" />;
  }
}

interface ModulePermissionCardProps {
  module: AppModule;
  selectedPermissions: string[];
  onTogglePermission: (permissionKey: string) => void;
  onToggleModulePermissions: (moduleKeys: string[]) => void;
}

export function ModulePermissionCard({
  module,
  selectedPermissions,
  onTogglePermission,
  onToggleModulePermissions,
}: ModulePermissionCardProps) {
  const modPerms = module?.permissions ?? [];
  const modKeys = modPerms?.map((p) => p.key) ?? [];
  const selectedInModCount = modKeys.filter((k) => selectedPermissions.includes(k)).length;
  const isAllModSelected = modKeys.length > 0 && selectedInModCount === modKeys.length;

  return (
    <div className="border-border/70 bg-card/60 hover:border-border rounded-xl border p-3.5 shadow-xs transition-all">
      {/* Module Header */}
      <div className="border-border/50 mb-3 flex items-center justify-between border-b pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="bg-muted/60 flex size-7 items-center justify-center rounded-md">
            {getModuleIcon(module?.key)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-foreground text-xs font-bold">{module?.name}</span>
              <Badge
                variant={selectedInModCount > 0 ? "default" : "outline"}
                className="h-4 px-1.5 text-[9px] font-semibold"
              >
                {selectedInModCount}/{modKeys.length}
              </Badge>
            </div>
            {module?.description && (
              <p className="text-muted-foreground line-clamp-1 text-[10px]">
                {module?.description}
              </p>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-6 px-2 text-[11px] font-medium"
          onClick={() => onToggleModulePermissions(modKeys)}
        >
          {isAllModSelected ? "Deselect All" : "Select All"}
        </Button>
      </div>

      {/* Module Permissions Grid */}
      <div className="grid gap-2 sm:grid-cols-2">
        {modPerms?.map((p) => {
          const isChecked = selectedPermissions.includes(p.key);
          return (
            <div
              key={p.key}
              onClick={() => onTogglePermission(p.key)}
              className={cn(
                "group flex cursor-pointer items-start justify-between gap-2.5 rounded-lg border p-2.5 transition-all duration-150 select-none",
                isChecked
                  ? "border-primary/50 bg-primary/[0.04] dark:bg-primary/[0.08] shadow-xs"
                  : "border-border/50 bg-background/50 hover:border-border hover:bg-accent/40",
              )}
            >
              <div className="grid flex-1 gap-1 leading-tight">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-foreground text-xs font-medium">{p?.name}</span>
                  <ActionBadge action={p?.action} permKey={p?.key} />
                </div>

                {p?.description && (
                  <p className="text-muted-foreground line-clamp-1 text-[10px]">{p?.description}</p>
                )}

                <span className="text-muted-foreground/70 font-mono text-[9px]">{p?.key}</span>
              </div>

              {/* Tactile Checkbox element inspired by UIverse */}
              <div
                className={cn(
                  "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-md border transition-all duration-150",
                  isChecked
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-muted-foreground/30 bg-background/80 group-hover:border-primary/40",
                )}
              >
                {isChecked && <CheckIcon className="size-3 stroke-[2.5]" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
