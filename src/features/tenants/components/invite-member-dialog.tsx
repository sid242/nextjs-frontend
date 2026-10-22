"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ControlledInput, ControlledSelect, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
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
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  activeTenantName,
  onInvite,
  isInviting = false,
}: InviteMemberDialogProps) {
  const methods = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberFormSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  });

  const roleOptions = useMemo(
    () => ROLE_OPTIONS?.map((opt) => ({ label: opt?.label, value: opt?.value })) ?? [],
    [],
  );

  const onSubmit = async (values: InviteMemberFormValues) => {
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
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an email invitation to join {activeTenantName ?? "this workspace"}.
          </DialogDescription>
        </DialogHeader>

        <FormWrapper methods={methods} onSubmit={onSubmit} className="grid gap-4 py-3">
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
      </DialogContent>
    </Dialog>
  );
}
