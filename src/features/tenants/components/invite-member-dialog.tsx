"use client";

import { useMemo } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowUpRight, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ControlledInput, ControlledSelect, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ROLE_OPTIONS } from "../constants";

const inviteMemberFormSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  role: z.string().min(1, "Please select a role"),
});

type InviteMemberFormValues = z.infer<typeof inviteMemberFormSchema>;

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTenantName?: string;
  onInvite: (email: string, role: string) => Promise<void>;
  isInviting?: boolean;
  remainingSeats?: number;
  maxMembers?: number;
  activeMembers?: number;
  planName?: string;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  activeTenantName,
  onInvite,
  isInviting = false,
  remainingSeats,
  maxMembers,
  activeMembers,
  planName,
}: InviteMemberDialogProps) {
  const methods = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberFormSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  });

  const isSeatLimitReached = remainingSeats !== undefined && remainingSeats <= 0;

  const roleOptions = useMemo(
    () => ROLE_OPTIONS?.map((opt) => ({ label: opt?.label, value: opt?.value })) ?? [],
    [],
  );

  const onSubmit = async (values: InviteMemberFormValues) => {
    if (isSeatLimitReached) return;
    await onInvite(values.email.trim(), values.role);
    methods.reset();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      methods.reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle>Invite Team Member</DialogTitle>
            {maxMembers !== undefined && (
              <Badge
                variant={isSeatLimitReached ? "destructive" : "secondary"}
                className="gap-1 font-mono text-[10px]"
              >
                <Users className="h-3 w-3" />
                {activeMembers ?? 0} / {maxMembers} Seats
              </Badge>
            )}
          </div>
          <DialogDescription>
            Send an email invitation to join {activeTenantName ?? "this workspace"}.
          </DialogDescription>
        </DialogHeader>

        {isSeatLimitReached ? (
          <div className="space-y-4 py-2">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs font-semibold">Seat Limit Reached</AlertTitle>
              <AlertDescription className="text-xs">
                Your workspace has utilized all {maxMembers} available seat
                {maxMembers === 1 ? "" : "s"} on the {planName ?? "current"} plan. Upgrade your plan
                to invite additional members.
              </AlertDescription>
            </Alert>

            <div className="border-border/80 bg-muted/30 flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-xs font-medium">Need more team seats?</div>
                <div className="text-muted-foreground text-[11px]">
                  View plans and upgrade in workspace settings.
                </div>
              </div>
              <Button asChild size="sm" variant="default" className="gap-1 text-xs">
                <Link href="/settings/billing" onClick={() => onOpenChange(false)}>
                  Upgrade Plan <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <FormWrapper methods={methods} onSubmit={onSubmit} className="grid gap-4 py-3">
            {remainingSeats !== undefined && remainingSeats <= 2 && remainingSeats > 0 ? (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-600 dark:text-amber-400">
                ⚠️ Only <strong>{remainingSeats}</strong> seat
                {remainingSeats === 1 ? "" : "s"} remaining on your plan.
              </div>
            ) : null}

            <ControlledInput
              name="email"
              label="Email Address"
              type="email"
              required
              placeholder="colleague@company.com"
            />

            <ControlledSelect
              name="role"
              label="Assign Role"
              options={roleOptions}
              returnPrimitiveValue
              required
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <SubmitButton pending={isInviting} pendingText="Inviting…">
                Send Invite
              </SubmitButton>
            </DialogFooter>
          </FormWrapper>
        )}
      </DialogContent>
    </Dialog>
  );
}
