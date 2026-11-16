"use client";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { useCreateLead, useUpdateLead } from "../queries";
import type { Lead, LeadStatus } from "../types";

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}

function LeadFormInner({ lead, onClose }: { lead?: Lead | null; onClose: () => void }) {
  const isEditing = Boolean(lead);
  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();

  const [name, setName] = useState(lead?.name ?? "");
  const [email, setEmail] = useState(lead?.email ?? "");
  const [phone, setPhone] = useState(lead?.phone ?? "");
  const [company, setCompany] = useState(lead?.company ?? "");
  const [status, setStatus] = useState<LeadStatus>(lead?.status ?? "new");
  const [value, setValue] = useState<number>(lead?.value ?? 0);
  const [departmentId, setDepartmentId] = useState(lead?.departmentId ?? "sales-enterprise");
  const [regionId, setRegionId] = useState(lead?.regionId ?? "apac");
  const [assignedMemberId, setAssignedMemberId] = useState(lead?.assignedMemberId ?? "");
  const [isConfidential, setIsConfidential] = useState(lead?.isConfidential ?? false);
  const [notes, setNotes] = useState(lead?.notes ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && lead) {
        await updateMutation.mutateAsync({
          leadId: lead.id,
          input: {
            name,
            email,
            phone: phone || undefined,
            company: company || undefined,
            status,
            value: Number(value),
            departmentId: departmentId || undefined,
            regionId: regionId || undefined,
            assignedMemberId: assignedMemberId || null,
            isConfidential,
            notes: notes || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name,
          email,
          phone: phone || undefined,
          company: company || undefined,
          status,
          value: Number(value),
          departmentId: departmentId || undefined,
          regionId: regionId || undefined,
          assignedMemberId: assignedMemberId || undefined,
          isConfidential,
          notes: notes || undefined,
        });
      }
      onClose();
    } catch {
      // Handled by toast/mutation
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="lead-name">Contact Name</Label>
          <Input
            id="lead-name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lead-email">Email</Label>
          <Input
            id="lead-email"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="lead-company">Company</Label>
          <Input
            id="lead-company"
            placeholder="Acme Technologies"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lead-phone">Phone</Label>
          <Input
            id="lead-phone"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="lead-status">Status</Label>
          <Select value={status} onValueChange={(val: LeadStatus) => setStatus(val)}>
            <SelectTrigger id="lead-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lead-value">Deal Value ($)</Label>
          <Input
            id="lead-value"
            type="number"
            placeholder="5000"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lead-dept">Department</Label>
          <Input
            id="lead-dept"
            placeholder="sales-enterprise"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lead-notes">Notes</Label>
        <Textarea
          id="lead-notes"
          placeholder="Deal context, meeting notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="lead-confidential">Confidential Lead</Label>
          <p className="text-muted-foreground text-xs">
            Gated by policy: confidential records are hidden from non-executive roles.
          </p>
        </div>
        <Switch
          id="lead-confidential"
          checked={isConfidential}
          onCheckedChange={setIsConfidential}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !name || !email}>
          {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Lead"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function LeadFormDialog({ open, onOpenChange, lead }: LeadFormDialogProps) {
  const isEditing = Boolean(lead);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit CRM Lead" : "New CRM Lead"}</DialogTitle>
          <DialogDescription>
            Leads are dynamically scoped and protected by your workspace PBAC policies.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <LeadFormInner key={lead?.id ?? "new"} lead={lead} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
