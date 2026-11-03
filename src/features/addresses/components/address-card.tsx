"use client";

import { Check, Edit, MapPin, Phone, Star, Trash2, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

import type { Address } from "../schemas";

export interface AddressCardProps {
  address: Address;
  onEdit?: (address: Address) => void;
  onDelete?: (id: string) => void;
  onSetDefault?: (id: string) => void;
  canWrite?: boolean;
  canDelete?: boolean;
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  canWrite = true,
  canDelete = true,
}: AddressCardProps) {
  const parts = [
    address.line1,
    address.line2,
    address.landmark ? `Near ${address.landmark}` : null,
    address.localityName,
    address.subdistrictName,
    address.districtName,
    address.stateName,
    address.postalCode,
    address.countryCode,
  ].filter(Boolean);

  return (
    <Card className="flex flex-col justify-between border shadow-xs">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold tracking-wide">
              {address.type}
            </Badge>
            {address.label && (
              <span className="text-foreground max-w-[160px] truncate text-sm font-medium">
                {address.label}
              </span>
            )}
          </div>
          {address.isDefault && (
            <Badge variant="default" className="flex items-center gap-1 text-xs">
              <Check className="h-3 w-3" />
              Default
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="text-muted-foreground flex-1 space-y-2 text-sm">
        {(address.recipientName || address.phone) && (
          <div className="text-foreground mb-1 flex flex-wrap items-center gap-3 text-xs font-medium">
            {address.recipientName && (
              <span className="flex items-center gap-1">
                <User className="text-muted-foreground h-3.5 w-3.5" />
                {address.recipientName}
              </span>
            )}
            {address.phone && (
              <span className="flex items-center gap-1">
                <Phone className="text-muted-foreground h-3.5 w-3.5" />
                {address.phone}
              </span>
            )}
          </div>
        )}

        <div className="flex items-start gap-1.5 leading-relaxed">
          <MapPin className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
          <span>{parts.join(", ")}</span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 border-t pt-2">
        <div>
          {!address.isDefault && canWrite && onSetDefault && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-8 text-xs"
              onClick={() => onSetDefault(address.id)}
            >
              <Star className="mr-1 h-3.5 w-3.5" />
              Make Default
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {canWrite && onEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs"
              onClick={() => onEdit(address)}
            >
              <Edit className="mr-1 h-3.5 w-3.5" />
              Edit
            </Button>
          )}
          {canDelete && onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2.5 text-xs"
              onClick={() => onDelete(address.id)}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
