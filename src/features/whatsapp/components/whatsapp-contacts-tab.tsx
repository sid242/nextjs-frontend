"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, ShieldCheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useUpdateConsentMutation, whatsAppContactsQueryOptions } from "../queries";

export function WhatsAppContactsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: contacts = [], isLoading } = useQuery(whatsAppContactsQueryOptions(searchTerm));
  const consentMutation = useUpdateConsentMutation();

  const handleToggleConsent = (contactId: string, currentStatus: "OPTED_IN" | "OPTED_OUT") => {
    consentMutation.mutate({
      contactId,
      data: {
        purpose: "MARKETING",
        status: currentStatus === "OPTED_IN" ? "OPTED_OUT" : "OPTED_IN",
      },
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>WhatsApp Contacts &amp; Consent Registry</CardTitle>
          <CardDescription>
            Manage customer phone numbers, opt-in/opt-out status, and marketing compliance under
            Meta policies.
          </CardDescription>
        </div>
        <div className="relative w-full sm:w-64">
          <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            placeholder="Search phone or name..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground p-8 text-center text-sm">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
            No contacts found in registry. Contacts are automatically captured upon receiving
            messages or sending campaigns.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone Number (E.164)</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>WhatsApp ID (waId)</TableHead>
                <TableHead>Marketing Consent</TableHead>
                <TableHead>First Registered</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    {contact.phoneNumber}
                  </TableCell>
                  <TableCell>{contact.displayName || "—"}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {contact.waId || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                    >
                      <ShieldCheckIcon className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                      Opted In
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleConsent(contact.id, "OPTED_IN")}
                      disabled={consentMutation.isPending}
                      className="h-8 text-xs"
                    >
                      Toggle Opt-out
                    </Button>
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
