"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  MoreVerticalIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react";
import { toast } from "sonner";

import { TablePagination } from "@/components/molecules/table-pagination";
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
import { useDebouncedCallback, useSearchQueryParams } from "@/lib/hooks";

import { useAdminUsers, useUpdateUserRole, useUpdateUserStatus } from "../queries";
import type { AdminUser } from "../schemas";

export function AdminUsersCard() {
  const { get, getNumber, setParam, setParams } = useSearchQueryParams();
  const rawPage = getNumber("page", 1) ?? 1;
  const page = Math.max(1, rawPage);
  const rawLimit = getNumber("limit", 10) ?? 10;
  const pageSize = [10, 20, 50].includes(rawLimit) ? rawLimit : 10;

  const handlePageSizeChange = (newSize: number) => {
    setParams(
      { limit: newSize === 10 ? null : newSize, page: null },
      { mode: "replace", scroll: false },
    );
  };

  const [searchInput, setSearchInput] = useState<string>(() => get("q") ?? "");

  const syncSearchParam = useDebouncedCallback((val: string) => {
    setParams({ q: val.trim() || null, page: null }, { mode: "replace", scroll: false });
  }, 250);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e?.target?.value ?? "";
    setSearchInput(val);
    syncSearchParam.run(val);
  };

  const { data: usersData, isLoading } = useAdminUsers(page, pageSize);
  const updateRoleMutation = useUpdateUserRole();
  const updateStatusMutation = useUpdateUserStatus();

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

  const userList = useMemo(() => {
    if (Array.isArray(usersData)) return usersData;
    if (
      usersData &&
      typeof usersData === "object" &&
      Array.isArray((usersData as { items?: AdminUser[] })?.items)
    ) {
      return (usersData as { items: AdminUser[] }).items;
    }
    return [];
  }, [usersData]);

  const filteredUsers = useMemo(() => {
    const searchLower = (searchInput ?? "").trim().toLowerCase();
    if (!searchLower) return userList;
    return userList.filter(
      (u) =>
        (u?.name ?? "").toLowerCase().includes(searchLower) ||
        (u?.email ?? "").toLowerCase().includes(searchLower),
    );
  }, [userList, searchInput]);

  const totalItems =
    (usersData && typeof usersData === "object" && "total" in usersData
      ? (usersData as { total: number }).total
      : undefined) ?? userList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  return (
    <Card className="border-border/80 rounded-2xl shadow-xs">
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
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search platform users…"
            value={searchInput}
            onChange={handleSearchChange}
            className="border-border/80 h-9 rounded-xl pl-9 text-xs"
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
          <>
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

            <TablePagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]}
              onPageSizeChange={handlePageSizeChange}
              onPageChange={(p) =>
                setParam("page", p <= 1 ? null : p, { mode: "replace", scroll: false })
              }
              itemLabel="users"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
