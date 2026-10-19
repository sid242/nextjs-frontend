"use client";

import { useState } from "react";
import {
  MoreVerticalIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  UserXIcon,
  VenetianMaskIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { initials } from "@/lib/format";

import {
  useAdminUsers,
  useImpersonateUser,
  useUpdateUserRole,
  useUpdateUserStatus,
} from "../queries";

export function AdminUsersCard() {
  const { data: users = [], isLoading } = useAdminUsers(1);
  const updateRoleMutation = useUpdateUserRole();
  const updateStatusMutation = useUpdateUserStatus();
  const impersonateMutation = useImpersonateUser();

  const [search, setSearch] = useState("");

  const handleRoleToggle = async (userId: string, currentRole: "USER" | "ADMIN") => {
    const nextRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    try {
      await updateRoleMutation.mutateAsync({ userId, role: nextRole });
      toast.success(`User role changed to ${nextRole}`);
    } catch {
      toast.error("Failed to update user role");
    }
  };

  const handleStatusToggle = async (
    userId: string,
    currentStatus: "ACTIVE" | "SUSPENDED" | string,
  ) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await updateStatusMutation.mutateAsync({ userId, status: nextStatus });
      toast.success(`User status changed to ${nextStatus}`);
    } catch {
      toast.error("Failed to update user status");
    }
  };

  const handleImpersonate = async (userId: string, name: string) => {
    try {
      toast.info(`Switching session context into ${name}…`);
      await impersonateMutation.mutateAsync(userId);
    } catch {
      toast.error("Failed to impersonate user");
    }
  };

  const searchLower = (search ?? "").toLowerCase();
  const filteredUsers = (users ?? []).filter(
    (u) =>
      (u?.name ?? "").toLowerCase().includes(searchLower) ||
      (u?.email ?? "").toLowerCase().includes(searchLower),
  );

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ShieldAlertIcon className="size-4 text-amber-500" /> Platform User Directory
          </CardTitle>
          <CardDescription className="text-xs">
            Global administration: manage user roles, account suspension, and impersonation.
          </CardDescription>
        </div>

        <div className="relative w-full sm:w-60">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search platform users…"
            value={search}
            onChange={(e) => setSearch(e?.target?.value ?? "")}
            className="h-9 pl-9 text-xs"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="text-muted-foreground animate-pulse p-8 text-center text-sm">
            Loading platform users…
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-muted-foreground p-8 text-center text-sm">
            No platform users found.
          </div>
        ) : (
          <div className="divide-border/50 divide-y">
            {filteredUsers.map((u) => (
              <div
                key={u?.id}
                className="hover:bg-accent/30 flex flex-col gap-3 px-4 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials(u?.name ?? "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid leading-tight">
                    <span className="text-foreground text-sm font-semibold">{u?.name}</span>
                    <span className="text-muted-foreground text-xs">{u?.email}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <Badge
                    variant={u?.role === "ADMIN" ? "default" : "secondary"}
                    className="h-5 px-1.5 text-[10px]"
                  >
                    {u?.role}
                  </Badge>

                  <Badge
                    variant={u?.status === "ACTIVE" ? "outline" : "default"}
                    className={`h-5 px-1.5 text-[10px] ${
                      u?.status === "ACTIVE"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                        : "border-red-500/20 bg-red-500/10 text-red-600"
                    }`}
                  >
                    {u?.status}
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreVerticalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel className="text-xs">Admin Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 text-xs font-medium"
                        onClick={() => handleImpersonate(u?.id ?? "", u?.name ?? "User")}
                      >
                        <VenetianMaskIcon className="text-primary size-3.5" /> Impersonate User
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-xs"
                        onClick={() => handleRoleToggle(u?.id ?? "", u?.role ?? "USER")}
                      >
                        <ShieldCheckIcon className="size-3.5" />
                        {u.role === "ADMIN"
                          ? "Demote to Standard User"
                          : "Promote to Platform Admin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-xs"
                        onClick={() => handleStatusToggle(u?.id ?? "", u?.status ?? "ACTIVE")}
                      >
                        {u.status === "ACTIVE" ? (
                          <>
                            <UserXIcon className="size-3.5 text-red-500" /> Suspend Account
                          </>
                        ) : (
                          <>
                            <UserCheckIcon className="size-3.5 text-emerald-500" /> Reactivate
                            Account
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
