"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  CheckCircle2,
  Clock,
  MoreVertical,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

import { ColumnConfigDropdown } from "@/components/molecules/column-config-dropdown";
import { TablePagination } from "@/components/molecules/table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/api/errors";
import { formatDate } from "@/lib/format";
import {
  useDebouncedCallback,
  useSearchQueryParams,
  useTableColumns,
  type TableColumnDef,
} from "@/lib/hooks";

import { hasPlatformPermission, PLATFORM_PERMISSION_KEYS } from "../permissions";
import { usePlatformMe, usePlatformUsers, useUpdatePlatformUserStatus } from "../queries";
import type { PlatformUser } from "../schemas";

type UserColumnId = "user" | "status" | "emailVerified" | "lastLogin" | "createdAt" | "actions";

const USER_COLUMNS: TableColumnDef<UserColumnId>[] = [
  { id: "user", label: "User Account", canHide: false, defaultVisible: true },
  { id: "status", label: "Account Status", canHide: true, defaultVisible: true },
  { id: "emailVerified", label: "Email Verified", canHide: true, defaultVisible: true },
  { id: "lastLogin", label: "Last Login", canHide: true, defaultVisible: true },
  { id: "createdAt", label: "Registered", canHide: true, defaultVisible: true },
  { id: "actions", label: "Actions", canHide: false, defaultVisible: true },
];

const USER_COLUMN_LABELS: Record<UserColumnId, string> = {
  user: "User Account",
  status: "Account Status",
  emailVerified: "Email Verified",
  lastLogin: "Last Login",
  createdAt: "Registered",
  actions: "Actions",
};

interface StatusModalState {
  isOpen: boolean;
  user: PlatformUser | null;
  targetStatus: "ACTIVE" | "SUSPENDED" | null;
}

export function PlatformUsersTable() {
  const { data: me } = usePlatformMe();
  const canSuspend = hasPlatformPermission(me, PLATFORM_PERMISSION_KEYS.USERS_SUSPEND);

  const { get, getNumber, setParam, setParams } = useSearchQueryParams();
  const [searchInput, setSearchInput] = useState<string>(() => get("q") ?? "");

  const syncSearchParam = useDebouncedCallback((val: string) => {
    setParams({ q: val.trim() || null, page: null }, { mode: "replace", scroll: false });
  }, 250);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e?.target?.value ?? "";
    setSearchInput(val);
    syncSearchParam.run(val);
  };

  const statusFilter = get("status") ?? "ALL";
  const handleStatusChange = (val: string) => {
    setParams(
      { status: val === "ALL" ? null : val, page: null },
      { mode: "replace", scroll: false },
    );
  };

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

  const [statusModal, setStatusModal] = useState<StatusModalState>({
    isOpen: false,
    user: null,
    targetStatus: null,
  });

  const tableColumns = useTableColumns<UserColumnId>({
    columns: USER_COLUMNS,
    tableId: "platform_users_table",
  });

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      search: searchInput.trim() || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
    }),
    [page, pageSize, searchInput, statusFilter],
  );

  const { data, isLoading, error } = usePlatformUsers(queryParams);
  const updateStatusMutation = useUpdatePlatformUserStatus();

  const handleConfirmStatusToggle = async () => {
    if (!statusModal.user || !statusModal.targetStatus) return;

    try {
      await updateStatusMutation.mutateAsync({
        userId: statusModal.user.id,
        status: statusModal.targetStatus,
      });
      setStatusModal({ isOpen: false, user: null, targetStatus: null });
    } catch {
      // Handled by mutation error state
    }
  };

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  function renderCell(colId: UserColumnId, user: PlatformUser) {
    const isSuspended = user.status === "SUSPENDED";

    switch (colId) {
      case "user":
        return (
          <TableCell key="user">
            <div className="text-foreground font-medium">{user.name}</div>
            <div className="text-muted-foreground font-mono text-xs">{user.email}</div>
          </TableCell>
        );

      case "status":
        return (
          <TableCell key="status">
            <Badge
              variant={
                user.status === "ACTIVE"
                  ? "default"
                  : user.status === "SUSPENDED"
                    ? "destructive"
                    : "secondary"
              }
              className="text-2xs font-mono tracking-wider uppercase"
            >
              {user.status}
            </Badge>
          </TableCell>
        );

      case "emailVerified":
        return (
          <TableCell key="emailVerified">
            {user.emailVerified ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                Verified
              </span>
            ) : (
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <Clock className="size-3.5" />
                Unverified
              </span>
            )}
          </TableCell>
        );

      case "lastLogin":
        return (
          <TableCell key="lastLogin" className="text-muted-foreground text-xs">
            {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
          </TableCell>
        );

      case "createdAt":
        return (
          <TableCell key="createdAt" className="text-muted-foreground text-xs">
            {user.createdAt ? formatDate(user.createdAt) : "—"}
          </TableCell>
        );

      case "actions":
        return (
          <TableCell key="actions" className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Open user actions"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">User Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {canSuspend && (
                  <DropdownMenuItem
                    className={isSuspended ? "text-emerald-600" : "text-destructive"}
                    onClick={() =>
                      setStatusModal({
                        isOpen: true,
                        user,
                        targetStatus: isSuspended ? "ACTIVE" : "SUSPENDED",
                      })
                    }
                  >
                    {isSuspended ? (
                      <>
                        <UserCheck className="mr-2 size-4" />
                        Reactivate Account
                      </>
                    ) : (
                      <>
                        <UserX className="mr-2 size-4" />
                        Suspend Account
                      </>
                    )}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        );
    }
  }

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="text-primary size-5" />
            Customer User Accounts
          </CardTitle>
          <CardDescription className="text-sm">
            Inspect customer accounts, login telemetry, verification state, and suspend or
            reactivate access.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filter bar */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative max-w-sm min-w-50 flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search user name or email..."
                value={searchInput}
                onChange={handleSearchChange}
                className="h-9 pl-8 text-xs"
              />
            </div>

            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-9 w-40 text-xs">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
                <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <ShieldAlert className="size-4" />
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>
        )}

        {/* Table */}
        <div className="border-border/60 overflow-hidden rounded-xl border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="font-mono text-xs uppercase">
                {tableColumns.orderedVisibleColumns.map((colId) => (
                  <TableHead
                    key={colId}
                    className={colId === "actions" ? "w-28 min-w-28 pr-4 text-right" : undefined}
                  >
                    {colId === "actions" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-muted-foreground text-xs font-semibold">Actions</span>
                        <ColumnConfigDropdown
                          tableColumns={tableColumns}
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground hover:bg-muted size-8 cursor-pointer"
                          align="end"
                        />
                      </div>
                    ) : (
                      USER_COLUMN_LABELS[colId]
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    {tableColumns.orderedVisibleColumns.map((colId) => (
                      <TableCell key={colId}>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.items?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.orderedVisibleColumns.length}
                    className="text-muted-foreground h-32 text-center text-sm"
                  >
                    No user accounts found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items?.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30 text-xs">
                    {tableColumns.orderedVisibleColumns.map((colId) => renderCell(colId, user))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data && (
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={data.total}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            onPageSizeChange={handlePageSizeChange}
            onPageChange={(p) =>
              setParam("page", p <= 1 ? null : p, { mode: "replace", scroll: false })
            }
            itemLabel="user accounts"
          />
        )}
      </CardContent>

      {/* Confirmation Modal */}
      <Dialog
        open={statusModal.isOpen}
        onOpenChange={(open) => {
          if (!open) setStatusModal({ isOpen: false, user: null, targetStatus: null });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusModal.targetStatus === "SUSPENDED"
                ? "Suspend User Account"
                : "Reactivate User Account"}
            </DialogTitle>
            <DialogDescription>
              {statusModal.targetStatus === "SUSPENDED" ? (
                <>
                  Are you sure you want to suspend access for{" "}
                  <strong>{statusModal.user?.name}</strong> ({statusModal.user?.email})? They will
                  be immediately logged out and unable to access any associated tenants.
                </>
              ) : (
                <>
                  Reactivate access for <strong>{statusModal.user?.name}</strong> (
                  {statusModal.user?.email})? They will regain access to their tenant memberships.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {updateStatusMutation.isError && (
            <Alert variant="destructive">
              <ShieldAlert className="size-4" />
              <AlertDescription>{getErrorMessage(updateStatusMutation.error)}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusModal({ isOpen: false, user: null, targetStatus: null })}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={statusModal.targetStatus === "SUSPENDED" ? "destructive" : "default"}
              onClick={handleConfirmStatusToggle}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending
                ? "Updating..."
                : statusModal.targetStatus === "SUSPENDED"
                  ? "Suspend Account"
                  : "Reactivate Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
