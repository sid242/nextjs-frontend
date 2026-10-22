"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  MoreVertical,
  Search,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

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
import { Label } from "@/components/ui/label";
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

import { useCreateStaff, usePlatformRoles, useStaffList, useUpdateStaff } from "../queries";
import type { StaffMember } from "../schemas";

export function StaffTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRoleId, setNewRoleId] = useState("");

  // Form state for creating staff
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRoleId, setFormRoleId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: staffData, isLoading, error } = useStaffList();
  const { data: roles = [] } = usePlatformRoles();
  const { mutateAsync: createStaff, isPending: isCreating } = useCreateStaff();
  const { mutateAsync: updateStaff, isPending: isUpdating } = useUpdateStaff();

  const filteredStaff = useMemo(() => {
    return (staffData?.items ?? []).filter((member) => {
      const matchesSearch =
        (member?.displayName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (member?.email ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || member?.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [staffData?.items, search, statusFilter]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName || !formEmail || !formPassword || !formRoleId) {
      setFormError("All fields including platform role are required");
      return;
    }

    try {
      await createStaff({
        displayName: formName,
        email: formEmail,
        password: formPassword,
        roleId: formRoleId,
      });
      setCreateDialogOpen(false);
      setFormName("");
      setFormEmail("");
      setFormPassword("");
      setFormRoleId("");
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to create platform staff member"));
    }
  };

  const handleStatusToggle = async (member: StaffMember) => {
    const nextStatus = member?.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await updateStaff({
        id: member.id,
        input: { status: nextStatus },
      });
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to update status"));
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedStaff || !newRoleId) return;
    try {
      await updateStaff({
        id: selectedStaff.id,
        input: { roleId: newRoleId },
      });
      setRoleDialogOpen(false);
      setSelectedStaff(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to update role"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Metric Cards */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Staff Directory</h1>
          <p className="text-muted-foreground text-sm">
            Internal SaaS operators, security officers, and tenant support personnel.
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="gap-2 bg-red-600 text-white shadow-md shadow-red-600/20 hover:bg-red-700"
        >
          <UserPlus className="h-4 w-4" />
          Provision Staff Member
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-card/50 border-border/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs uppercase">
              Total Internal Staff
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold">
              {staffData?.total ?? 0}
              <Users className="text-muted-foreground/60 h-5 w-5" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card/50 border-border/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs text-emerald-500 uppercase">
              Active Operators
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold text-emerald-500">
              {(staffData?.items ?? []).filter((s) => s?.status === "ACTIVE").length}
              <CheckCircle2 className="h-5 w-5 text-emerald-500/60" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card/50 border-border/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs text-amber-500 uppercase">
              Assigned Roles
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold text-amber-500">
              {roles.length}
              <Shield className="h-5 w-5 text-amber-500/60" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
            <div className="relative w-full md:w-80">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Search staff by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>
            <div className="flex w-full items-center gap-2 md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-full text-xs md:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="text-destructive p-8 text-center text-sm">
              Failed to load platform staff roster: {getErrorMessage(error)}
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-muted-foreground p-12 text-center text-sm">
              No platform staff members found matching your search.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="font-mono text-xs uppercase">
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Platform Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow key={member.id} className="text-xs">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-xs font-bold text-red-500">
                          {member.displayName?.charAt(0).toUpperCase() ?? "S"}
                        </div>
                        <div>
                          <div className="text-foreground font-semibold">{member.displayName}</div>
                          <div className="text-muted-foreground font-mono text-[11px]">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/5 font-mono text-[10px] text-amber-500"
                      >
                        {member.roleName ?? member.roleKey ?? "Custom Role"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {member.status === "ACTIVE" && (
                        <Badge variant="success" className="gap-1 font-mono text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          ACTIVE
                        </Badge>
                      )}
                      {member.status === "SUSPENDED" && (
                        <Badge variant="warning" className="gap-1 font-mono text-[10px]">
                          <Clock className="h-3 w-3" />
                          SUSPENDED
                        </Badge>
                      )}
                      {member.status === "DEACTIVATED" && (
                        <Badge variant="destructive" className="gap-1 font-mono text-[10px]">
                          <XCircle className="h-3 w-3" />
                          DEACTIVATED
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-muted-foreground font-mono text-[11px]">
                      {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString() : "Never"}
                    </TableCell>

                    <TableCell className="text-muted-foreground font-mono text-[11px]">
                      {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "—"}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 text-xs">
                          <DropdownMenuLabel>Staff Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedStaff(member);
                              setNewRoleId(member.roleId);
                              setRoleDialogOpen(true);
                            }}
                          >
                            <Shield className="mr-2 h-3.5 w-3.5" />
                            Change Platform Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleStatusToggle(member)}
                            className={
                              member.status === "ACTIVE" ? "text-amber-500" : "text-emerald-500"
                            }
                          >
                            {member.status === "ACTIVE" ? (
                              <>
                                <Clock className="mr-2 h-3.5 w-3.5" />
                                Suspend Account
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-3.5 w-3.5" />
                                Reactivate Account
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Provision Staff Modal */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-red-500" />
              Provision Platform Staff Member
            </DialogTitle>
            <DialogDescription className="text-xs">
              Staff members operate across the internal SaaS surface and are never associated with
              tenant customer accounts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateStaff} className="space-y-4 py-2">
            {formError && (
              <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-md border p-3 text-xs">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Full Name</Label>
              <Input
                placeholder="Jane Operator"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Work Email</Label>
              <Input
                type="email"
                placeholder="jane@platform.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Temporary Password</Label>
              <Input
                type="password"
                placeholder="Minimum 8 characters"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Platform Role</Label>
              <Select value={formRoleId} onValueChange={setFormRoleId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select platform role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} ({role.key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {isCreating ? "Provisioning..." : "Create Staff Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Role Modal */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Reassign Platform Role
            </DialogTitle>
            <DialogDescription className="text-xs">
              Change the operational permission scope for {selectedStaff?.displayName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Target Platform Role</Label>
              <Select value={newRoleId} onValueChange={setNewRoleId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} ({role.key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleUpdateRole}
              disabled={isUpdating}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {isUpdating ? "Updating..." : "Save Role Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
