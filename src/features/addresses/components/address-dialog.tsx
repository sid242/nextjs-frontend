"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Address, AddressInput } from "../schemas";
import { AddressForm } from "./address-form";

export interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Address | null;
  onSubmit: (values: AddressInput) => void | Promise<void>;
  isLoading?: boolean;
}

export function AddressDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isLoading,
}: AddressDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Address" : "Add New Address"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update your physical location details and administrative boundaries."
              : "Enter address details with verified Indian administrative boundaries."}
          </DialogDescription>
        </DialogHeader>

        <AddressForm
          initialData={initialData}
          onSubmit={async (values) => {
            await onSubmit(values);
            onOpenChange(false);
          }}
          isLoading={isLoading}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
