"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, UserCheck, Users, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { PlatformGroupMember, TenantGroupMember, UserGroup } from "../types";

export interface CandidateMember {
  id: string;
  name: string;
  email: string;
}

interface GroupMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: UserGroup | null;
  members: (TenantGroupMember | PlatformGroupMember)[];
  isLoadingMembers: boolean;
  onRemoveMember: (memberId: string) => Promise<void>;
  onAddMembers: (memberIds: string[]) => Promise<void>;
  candidateMembers?: CandidateMember[];
  canManageMembers?: boolean;
}

export function GroupMembersDialog({
  open,
  onOpenChange,
  group,
  members,
  isLoadingMembers,
  onRemoveMember,
  onAddMembers,
  candidateMembers = [],
  canManageMembers = true,
}: GroupMembersDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (!group) return null;

  // Filter current members by search
  const filteredMembers = members.filter((m) => {
    const displayName = ("name" in m ? m.name : m.displayName) ?? "";
    const email = m.email ?? "";
    return (
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Filter candidate members who are not already in the group
  const existingMemberIds = new Set(members.map((m) => ("userId" in m ? m.userId : m.staffId)));
  const eligibleCandidates = candidateMembers.filter(
    (c) =>
      !existingMemberIds.has(c.id) &&
      (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleToggleCandidate = (id: string) => {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleAddSubmit = async () => {
    if (selectedCandidates.length === 0) return;
    setIsSubmitting(true);
    try {
      await onAddMembers(selectedCandidates);
      setSelectedCandidates([]);
      setIsAddingMode(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    setRemovingId(memberId);
    try {
      await onRemoveMember(memberId);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col p-6 sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-6">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Users className="h-5 w-5 text-indigo-500" />
                {group.name}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {group.description || `Manage members of the ${group.name} group.`}
              </DialogDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {members.length} {members.length === 1 ? "member" : "members"}
            </Badge>
          </div>
        </DialogHeader>

        {/* Action / Search Toolbar */}
        <div className="flex items-center justify-between gap-3 pt-4">
          <Input
            placeholder={isAddingMode ? "Search eligible candidates..." : "Filter members..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 rounded-xl"
          />

          {canManageMembers && (
            <Button
              variant={isAddingMode ? "secondary" : "default"}
              onClick={() => {
                setIsAddingMode(!isAddingMode);
                setSelectedCandidates([]);
              }}
              className="h-10 shrink-0 rounded-xl"
            >
              {isAddingMode ? (
                <>
                  <X className="mr-1.5 h-4 w-4" /> Cancel
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Members
                </>
              )}
            </Button>
          )}
        </div>

        {/* Body Content */}
        <div className="mt-4 min-h-60 flex-1 overflow-y-auto rounded-xl border">
          {isAddingMode ? (
            /* Candidate Selection List */
            <div>
              <div className="bg-muted/40 text-muted-foreground flex items-center justify-between border-b p-3 text-xs font-semibold tracking-wider uppercase">
                <span>Select members to add ({selectedCandidates.length} selected)</span>
                {selectedCandidates.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleAddSubmit}
                    disabled={isSubmitting}
                    className="h-8 rounded-lg"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="mr-1 h-3.5 w-3.5" />
                    )}
                    Confirm Add ({selectedCandidates.length})
                  </Button>
                )}
              </div>

              {eligibleCandidates.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center text-sm">
                  No eligible candidates available to add.
                </div>
              ) : (
                <div className="divide-y">
                  {eligibleCandidates.map((c) => {
                    const isSelected = selectedCandidates.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleToggleCandidate(c.id)}
                        className={`flex cursor-pointer items-center justify-between p-3.5 transition-colors ${
                          isSelected ? "bg-indigo-50/50 dark:bg-indigo-950/20" : "hover:bg-muted/30"
                        }`}
                      >
                        <div>
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-muted-foreground text-xs">{c.email}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Current Members Table */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  {canManageMembers && <TableHead className="w-16 text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingMembers ? (
                  <TableRow>
                    <TableCell colSpan={canManageMembers ? 4 : 3} className="h-32 text-center">
                      <Loader2 className="text-muted-foreground mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canManageMembers ? 4 : 3}
                      className="text-muted-foreground h-32 text-center text-sm"
                    >
                      {searchTerm ? "No matching members found" : "No members in this group yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((m) => {
                    const memberId = "userId" in m ? m.userId : m.staffId;
                    const displayName = ("name" in m ? m.name : m.displayName) ?? "";
                    const isRemoving = removingId === memberId;

                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{displayName}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{m.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {m.status}
                          </Badge>
                        </TableCell>
                        {canManageMembers && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemove(memberId)}
                              disabled={isRemoving}
                              className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-lg"
                              title="Remove from group"
                            >
                              {isRemoving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
