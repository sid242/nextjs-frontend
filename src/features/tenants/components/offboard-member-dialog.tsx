"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, UserMinus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { TenantMember } from "../schemas";

interface OffboardMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TenantMember | null;
  activeMembers: TenantMember[];
  onOffboard: (memberId: string, reassignToMemberId?: string, reason?: string) => Promise<void>;
  isPending?: boolean;
}

export function OffboardMemberDialog({
  open,
  onOpenChange,
  member,
  activeMembers = [],
  onOffboard,
  isPending = false,
}: OffboardMemberDialogProps) {
  const [reassignToMemberId, setReassignToMemberId] = useState<string>("none");
  const [reason, setReason] = useState<string>("");

  const eligibleSuccessors = useMemo(() => {
    return (activeMembers ?? []).filter((m) => m?.id !== member?.id && m?.status === "ACTIVE");
  }, [activeMembers, member?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    const targetId = reassignToMemberId === "none" ? undefined : reassignToMemberId;
    await onOffboard(member.id, targetId, reason.trim() || undefined);
    setReason("");
    setReassignToMemberId("none");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="text-destructive flex items-center gap-2">
            <UserMinus className="size-5" />
            <DialogTitle>Offboard Team Member</DialogTitle>
          </div>
          <DialogDescription>
            Begin the offboarding lifecycle for{" "}
            <span className="text-foreground font-semibold">{member?.name ?? "this member"}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Alert
            variant="destructive"
            className="border-destructive/40 bg-destructive/10 text-destructive text-xs"
          >
            <AlertTriangle className="size-4" />
            <AlertTitle className="text-xs font-semibold">Security & Access Impact</AlertTitle>
            <AlertDescription className="text-xs leading-relaxed">
              All active sessions will be terminated immediately. The member will lose access to
              this organization and their status will become Suspended.
            </AlertDescription>
          </Alert>

          <div className="space-y-1.5">
            <Label htmlFor="reassign-select" className="text-xs font-medium">
              Reassign Owned Resources (Files & Workflows)
            </Label>
            <Select
              value={reassignToMemberId}
              onValueChange={setReassignToMemberId}
              disabled={isPending}
            >
              <SelectTrigger id="reassign-select" className="h-9 text-xs">
                <SelectValue placeholder="Select team member to take ownership" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">
                  Do not reassign (keep unassigned)
                </SelectItem>
                {eligibleSuccessors.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id} className="text-xs">
                    {candidate.name} ({candidate.email}) - {candidate.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-[11px]">
              Files and resources owned by this user will be transferred to the chosen member.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="offboard-reason" className="text-xs font-medium">
              Reason / Departure Notes (Optional)
            </Label>
            <Textarea
              id="offboard-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Contract completed, department transfer, or resignation..."
              className="min-h-[80px] resize-none text-xs"
              disabled={isPending}
              maxLength={500}
            />
            <p className="text-muted-foreground text-[11px]">
              Recorded in the immutable compliance audit log.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isPending}
              className="gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Offboarding…
                </>
              ) : (
                <>
                  <UserMinus className="size-3.5" /> Confirm Offboard
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
