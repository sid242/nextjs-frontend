"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  useDeleteTemplateMutation,
  useSubmitTemplateMutation,
  useSyncTemplatesMutation,
  whatsAppTemplatesQueryOptions,
} from "../queries";
import type { WhatsAppTemplate } from "../types";
import { WhatsAppTemplateBuilderDialog } from "./whatsapp-template-builder-dialog";

export function WhatsAppTemplatesTab() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [builderOpen, setBuilderOpen] = useState(false);

  const { data, isLoading } = useQuery(
    whatsAppTemplatesQueryOptions({
      category: category !== "ALL" ? category : undefined,
      search: search || undefined,
    }),
  );

  const submitMutation = useSubmitTemplateMutation();
  const syncMutation = useSyncTemplatesMutation();
  const deleteMutation = useDeleteTemplateMutation();

  const templates: WhatsAppTemplate[] = data?.items ?? [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
            <CheckCircleIcon className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "PENDING":
      case "SUBMITTED":
        return (
          <Badge variant="outline" className="border-amber-500/30 text-amber-600">
            <ClockIcon className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="border-red-500/20 bg-red-500/10 text-red-600">
            <XCircleIcon className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Message Templates</CardTitle>
            <CardDescription>
              Create, submit, and manage Meta WhatsApp message templates for notifications and
              campaigns.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCwIcon
                className={`mr-2 h-3.5 w-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`}
              />
              Sync Meta
            </Button>
            <Button size="sm" onClick={() => setBuilderOpen(true)}>
              <PlusIcon className="mr-1.5 h-4 w-4" />
              Create Template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
            <div className="relative w-full md:w-72">
              <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>
            <div className="flex w-full items-center gap-2 md:w-auto">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-40 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="UTILITY">Utility</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Templates Table */}
          {isLoading ? (
            <div className="text-muted-foreground p-8 text-center text-sm">
              Loading message templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground text-sm">No templates found matching criteria.</p>
              <Button size="sm" onClick={() => setBuilderOpen(true)}>
                <PlusIcon className="mr-1 h-3.5 w-3.5" />
                Create your first template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Meta ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((tpl) => (
                  <TableRow key={tpl.id}>
                    <TableCell className="text-sm font-semibold">{tpl.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {tpl.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs uppercase">
                      {tpl.language}
                    </TableCell>
                    <TableCell>{getStatusBadge(tpl.status)}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {tpl.metaTemplateId || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {tpl.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-primary h-7 text-xs"
                            onClick={() => submitMutation.mutate(tpl.id)}
                            disabled={submitMutation.isPending}
                          >
                            <SendIcon className="mr-1 h-3 w-3" />
                            Submit
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-7 w-7"
                          onClick={() => deleteMutation.mutate(tpl.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2Icon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <WhatsAppTemplateBuilderDialog open={builderOpen} onOpenChange={setBuilderOpen} />
    </div>
  );
}
