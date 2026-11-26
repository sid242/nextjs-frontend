"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckIcon, PhoneIcon, ShieldCheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useUpdatePhoneNumberMutation, whatsAppPhoneNumbersQueryOptions } from "../queries";

export function WhatsAppPhoneNumbersTab() {
  const { data: numbers = [], isLoading } = useQuery(whatsAppPhoneNumbersQueryOptions());
  const updateMutation = useUpdatePhoneNumberMutation();

  const handleToggleEnabled = (id: string, current: boolean) => {
    updateMutation.mutate({ id, data: { isEnabled: !current } });
  };

  const handleSetDefault = (id: string) => {
    updateMutation.mutate({ id, data: { isDefault: true } });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-muted-foreground p-6 text-sm">
          Loading phone numbers...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected WhatsApp Phone Numbers</CardTitle>
        <CardDescription>
          Manage sending numbers, messaging limit tiers, and verified display names.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {numbers.length === 0 ? (
          <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            No phone numbers connected yet. Connect your WhatsApp Business Account first.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone Number</TableHead>
                <TableHead>Verified Display Name</TableHead>
                <TableHead>Phone Number ID</TableHead>
                <TableHead>Quality Rating</TableHead>
                <TableHead>Messaging Limit</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {numbers.map((phone) => (
                <TableRow key={phone.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="text-muted-foreground h-4 w-4" />
                      <span>{phone.displayPhoneNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span>{phone.verifiedName || "N/A"}</span>
                      {phone.verifiedName && (
                        <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {phone.phoneNumberId}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        phone.qualityRating === "GREEN"
                          ? "border-emerald-500 text-emerald-600"
                          : phone.qualityRating === "YELLOW"
                            ? "border-amber-500 text-amber-600"
                            : "border-muted text-muted-foreground"
                      }
                    >
                      {phone.qualityRating || "UNKNOWN"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {phone.messagingLimit || "TIER_1K"}
                  </TableCell>
                  <TableCell>
                    {phone.isDefault ? (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        <CheckIcon className="mr-1 h-3 w-3" />
                        Default
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleSetDefault(phone.id)}
                        disabled={updateMutation.isPending}
                      >
                        Set Default
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={phone.isEnabled}
                      onCheckedChange={() => handleToggleEnabled(phone.id, phone.isEnabled)}
                      disabled={updateMutation.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
