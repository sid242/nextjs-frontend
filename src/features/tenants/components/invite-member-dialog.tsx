import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ROLE_OPTIONS } from "../constants";

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
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    await onInvite(trimmed, role);
    setEmail("");
    setRole("MEMBER");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEmail("");
      setRole("MEMBER");
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

        <div className="grid gap-4 py-3">
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e?.target?.value ?? "")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="invite-role">Assign Role</Label>
            <Select value={role} onValueChange={(val) => setRole(val)}>
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS?.map((option) => (
                  <SelectItem key={option?.value} value={option?.value}>
                    {option?.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!email.trim() || isInviting}>
            {isInviting ? "Inviting…" : "Send Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
