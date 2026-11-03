"use client";

import { useState } from "react";
import { MapPin, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { AddressScope } from "../api";
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useUpdateAddress,
} from "../queries";
import type { Address, AddressInput } from "../schemas";
import { AddressCard } from "./address-card";
import { AddressForm } from "./address-form";

export interface AddressBookProps {
  scope: AddressScope;
  title?: string;
  description?: string;
  canWrite?: boolean;
  canDelete?: boolean;
}

export function AddressBook({
  scope,
  title = "Addresses",
  description = "Manage physical locations, billing, and shipping destinations.",
  canWrite = true,
  canDelete = true,
}: AddressBookProps) {
  const { data: addresses, isLoading } = useAddresses(scope);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const createMutation = useCreateAddress(scope);
  const updateMutation = useUpdateAddress(scope);
  const deleteMutation = useDeleteAddress(scope);
  const setDefaultMutation = useSetDefaultAddress(scope);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setIsFormOpen(true);
  };

  const handleEdit = (addr: Address) => {
    setEditingAddress(addr);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingAddress(null);
  };

  const handleSubmit = async (values: AddressInput) => {
    if (editingAddress?.id) {
      await updateMutation.mutateAsync({ id: editingAddress.id, body: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setIsFormOpen(false);
    setEditingAddress(null);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="text-primary h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1 text-sm">
            {description}
          </CardDescription>
        </div>

        {canWrite && !isFormOpen && (
          <Button type="button" size="sm" onClick={handleOpenAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Address
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Inline Form Section (Replaces modal popup) */}
        {isFormOpen && (
          <div className="border-border/80 bg-muted/20 rounded-2xl border p-5">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h3 className="text-base font-semibold">
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </h3>
                <p className="text-muted-foreground text-xs">
                  {editingAddress
                    ? "Update location details and administrative boundaries."
                    : "Enter address details with verified Indian administrative boundaries."}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <AddressForm
              initialData={editingAddress}
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Address Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : (addresses?.length ?? 0) === 0 && !isFormOpen ? (
          <div className="bg-muted/20 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <MapPin className="text-muted-foreground/50 mb-3 h-10 w-10" />
            <p className="text-foreground text-sm font-medium">No addresses found</p>
            <p className="text-muted-foreground mt-1 max-w-sm text-xs">
              Add your first address to maintain standardized verified administrative boundaries.
            </p>
            {canWrite && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenAdd}
                className="mt-4"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Address
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {addresses?.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={canWrite ? () => handleEdit(addr) : undefined}
                onDelete={canDelete ? () => deleteMutation.mutateAsync(addr.id) : undefined}
                onSetDefault={
                  canWrite && !addr.isDefault
                    ? () => setDefaultMutation.mutateAsync(addr.id)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
