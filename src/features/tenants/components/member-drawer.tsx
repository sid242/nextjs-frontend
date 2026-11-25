"use client";

import { useMemo } from "react";
import { Briefcase, Calendar, Mail, MapPin, Shield, UserMinus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberAccessExplainer } from "@/features/rbac";
import { formatDate } from "@/lib/date";
import { initials } from "@/lib/format";
import { resolveStorageUrl } from "@/lib/storage";

import { MEMBER_ROLE_OPTIONS } from "../constants";
import { useActiveTenant } from "../queries";
import type { TenantMember } from "../schemas";

interface MemberDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TenantMember | null;
  tenantId?: string;
  onRoleChange?: (memberId: string, newRole: string) => void;
  onOffboardMember?: (member: TenantMember) => void;
  onManageAddresses?: (memberId: string, memberName: string) => void;
  canManageRoles?: boolean;
  canRemoveMembers?: boolean;
  roles?: Array<{ id?: string; name: string; description?: string | null }>;
}

export function MemberDrawer({
  open,
  onOpenChange,
  member,
  tenantId,
  onRoleChange,
  onOffboardMember,
  onManageAddresses,
  canManageRoles = true,
  canRemoveMembers = true,
  roles,
}: MemberDrawerProps) {
  const { activeTenantId } = useActiveTenant();
  const effectiveTenantId = tenantId ?? member?.tenantId ?? activeTenantId ?? "";

  const availableRoleOptions = useMemo(() => {
    if (roles && roles.length > 0) {
      return roles.map((r) => {
        const matchingSystem = MEMBER_ROLE_OPTIONS.find(
          (opt) => opt.value.toUpperCase() === r.name.toUpperCase(),
        );
        return {
          value: r.name,
          label: matchingSystem?.label ?? r.name,
        };
      });
    }
    return MEMBER_ROLE_OPTIONS;
  }, [roles]);

  if (!member) return null;

  const currentRole = member.role ?? "MEMBER";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="gap-3 pb-2 text-left">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 shrink-0">
              {member?.avatarUrl ? (
                <AvatarImage src={resolveStorageUrl(member.avatarUrl)} alt={member?.name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid leading-tight">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-foreground text-base font-bold">
                  {member.name}
                </SheetTitle>
                {member.memberCode && (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {member.memberCode}
                  </Badge>
                )}
              </div>
              <SheetDescription className="text-muted-foreground truncate text-xs">
                {member.email}
              </SheetDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge
              variant={
                member.status === "ACTIVE"
                  ? "outline"
                  : member.status === "INVITED"
                    ? "secondary"
                    : "destructive"
              }
              className="text-[10px] font-semibold tracking-wider uppercase"
            >
              {member.status}
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-medium">
              Role: {member.role}
            </Badge>
            {member.employmentType && (
              <Badge variant="outline" className="text-[10px] capitalize">
                {member.employmentType.toLowerCase().replace(/_/g, " ")}
              </Badge>
            )}
            {member.offboardedAt && (
              <Badge variant="destructive" className="text-[10px]">
                Offboarded
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Separator className="my-3" />

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid h-auto min-h-9 w-full grid-cols-3">
            <TabsTrigger value="profile" className="px-2 text-xs">
              Profile
            </TabsTrigger>
            <TabsTrigger value="roles" className="px-2 text-xs">
              Role & Access
            </TabsTrigger>
            <TabsTrigger value="actions" className="px-2 text-xs">
              Actions
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Profile & HR Fields */}
          <TabsContent value="profile" className="space-y-4 pt-3">
            <div className="border-border/70 bg-accent/10 space-y-2.5 rounded-xl border p-3">
              <h4 className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                <Briefcase className="text-primary size-3.5" /> Employment & Organization
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Job Title</span>
                  <span className="font-medium">{member.jobTitle || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Department</span>
                  <span className="font-medium">{member.department || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Employment Type</span>
                  <span className="font-medium capitalize">
                    {member.employmentType
                      ? member.employmentType.toLowerCase().replace(/_/g, " ")
                      : "Standard"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Work Location</span>
                  <span className="font-medium">{member.location || "Remote / Default"}</span>
                </div>
              </div>
            </div>

            <div className="border-border/70 bg-accent/10 space-y-2.5 rounded-xl border p-3">
              <h4 className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                <Mail className="text-primary size-3.5" /> Contact Details
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Primary Email</span>
                  <span className="font-medium">{member.email}</span>
                </div>
                {member.workEmail && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Work Email</span>
                    <span className="font-medium">{member.workEmail}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phone Number</span>
                  <span className="font-medium">{member.phone || "Not provided"}</span>
                </div>
              </div>
            </div>

            <div className="border-border/70 bg-accent/10 space-y-2.5 rounded-xl border p-3">
              <h4 className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                <Calendar className="text-primary size-3.5" /> Timeline & Activity
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Joined Date</span>
                  <span className="font-medium">
                    {member.joinedAt ? formatDate(new Date(member.joinedAt)) : "Pending acceptance"}
                  </span>
                </div>
                {member.invitedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Invited On</span>
                    <span className="font-medium">{formatDate(new Date(member.invitedAt))}</span>
                  </div>
                )}
                {member.lastLoginAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last Login</span>
                    <span className="font-medium">{formatDate(new Date(member.lastLoginAt))}</span>
                  </div>
                )}
                {member.offboardedAt && (
                  <div className="text-destructive flex items-center justify-between">
                    <span>Offboarded On</span>
                    <span className="font-semibold">
                      {formatDate(new Date(member.offboardedAt))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Role & Access */}
          <TabsContent value="roles" className="space-y-4 pt-3">
            <div className="border-border/70 bg-accent/10 space-y-3 rounded-xl border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                    <Shield className="text-primary size-3.5" /> Assigned Workspace Role
                  </h4>
                  <p className="text-muted-foreground text-[11px]">
                    Determines feature access and tenant management permissions.
                  </p>
                </div>
              </div>

              {canManageRoles && onRoleChange && member.role !== "OWNER" ? (
                <div className="space-y-1.5 pt-1">
                  <label className="text-muted-foreground text-[11px] font-medium">
                    Change Member Role
                  </label>
                  <Select value={currentRole} onValueChange={(val) => onRoleChange(member.id, val)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoleOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="pt-1">
                  <Badge variant="outline" className="px-2.5 py-1 text-xs font-semibold">
                    {member.role}
                  </Badge>
                  {member.role === "OWNER" && (
                    <p className="text-muted-foreground mt-1 text-[11px]">
                      Primary owner of this organization. Ownership must be transferred before role
                      changes.
                    </p>
                  )}
                </div>
              )}
            </div>

            {effectiveTenantId && member.id && (
              <MemberAccessExplainer tenantId={effectiveTenantId} memberId={member.id} />
            )}
          </TabsContent>

          {/* Tab 3: Actions */}
          <TabsContent value="actions" className="space-y-3 pt-3">
            {onManageAddresses && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-full justify-start gap-2 text-xs"
                onClick={() => {
                  onOpenChange(false);
                  onManageAddresses(member.id, member.name);
                }}
              >
                <MapPin className="text-primary size-3.5" /> Manage Physical Addresses
              </Button>
            )}

            {canRemoveMembers &&
              member.status === "ACTIVE" &&
              member.role !== "OWNER" &&
              onOffboardMember && (
                <div className="border-destructive/30 bg-destructive/5 space-y-2 rounded-xl border p-3">
                  <h5 className="text-destructive flex items-center gap-1.5 text-xs font-semibold">
                    <UserMinus className="size-3.5" /> Offboarding Lifecycle
                  </h5>
                  <p className="text-muted-foreground text-[11px]">
                    Safely revoke sessions, suspend access, and reassign owned resources to a
                    teammate.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-1 h-8 w-full gap-2 text-xs"
                    onClick={() => {
                      onOpenChange(false);
                      onOffboardMember(member);
                    }}
                  >
                    <UserMinus className="size-3.5" /> Start Offboarding
                  </Button>
                </div>
              )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
