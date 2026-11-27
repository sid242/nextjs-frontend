"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  EyeIcon,
  PencilIcon,
  PhoneCallIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { getErrorMessage } from "@/lib/api/errors";

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
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<WhatsAppTemplate | null>(null);

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

  const handleSync = async () => {
    try {
      const res = await syncMutation.mutateAsync();
      toast.success(`Synchronized ${res.count} templates from Meta`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to sync templates"));
    }
  };

  const handleSubmit = async (tpl: WhatsAppTemplate) => {
    try {
      await submitMutation.mutateAsync(tpl.id);
      toast.success(`Template '${tpl.name}' submitted to Meta for approval`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to submit template"));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTemplate) return;
    try {
      await deleteMutation.mutateAsync(deletingTemplate.id);
      toast.success(`Template '${deletingTemplate.name}' deleted`);
      setDeletingTemplate(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete template"));
    }
  };

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
              onClick={handleSync}
              disabled={syncMutation.isPending}
            >
              <RefreshCwIcon
                className={`mr-2 h-3.5 w-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`}
              />
              Sync Meta
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingTemplate(null);
                setBuilderOpen(true);
              }}
            >
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
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="View template"
                          onClick={() => setViewingTemplate(tpl)}
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                        </Button>
                        {tpl.status !== "SUBMITTED" && tpl.status !== "PENDING" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            title="Edit template"
                            onClick={() => {
                              setEditingTemplate(tpl);
                              setBuilderOpen(true);
                            }}
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {tpl.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-primary h-7 text-xs"
                            onClick={() => handleSubmit(tpl)}
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
                          title="Delete template"
                          onClick={() => setDeletingTemplate(tpl)}
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

      <WhatsAppTemplateBuilderDialog
        open={builderOpen}
        onOpenChange={(open) => {
          setBuilderOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        template={editingTemplate}
      />

      {/* View Template Dialog */}
      <Dialog
        open={!!viewingTemplate}
        onOpenChange={(open) => {
          if (!open) setViewingTemplate(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{viewingTemplate?.name}</span>
              {viewingTemplate && getStatusBadge(viewingTemplate.status)}
            </DialogTitle>
            <DialogDescription>
              {viewingTemplate?.category} • Language: {viewingTemplate?.language}
              {viewingTemplate?.metaTemplateId
                ? ` • Meta ID: ${viewingTemplate.metaTemplateId}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {viewingTemplate && (
            <div className="space-y-4">
              {viewingTemplate.rejectionReason && (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                  <strong>Rejection Reason:</strong> {viewingTemplate.rejectionReason}
                </div>
              )}

              {/* WhatsApp Preview */}
              <div className="rounded-xl bg-[#e5ddd5] p-4 dark:bg-zinc-900/80">
                {(() => {
                  const comps = viewingTemplate.components ?? [];
                  const header = comps.find((c) => c.type === "HEADER");
                  const body = comps.find((c) => c.type === "BODY");
                  const footer = comps.find((c) => c.type === "FOOTER");
                  const buttonsComp = comps.find((c) => c.type === "BUTTONS");
                  const carousel = comps.find((c) => c.type === "CAROUSEL");

                  return (
                    <div className="mx-auto max-w-sm space-y-1.5">
                      <div className="text-foreground space-y-1.5 rounded-lg rounded-tl-none border bg-white p-3 text-xs shadow-sm dark:bg-zinc-800">
                        {header?.format === "TEXT" && header.text && (
                          <p className="font-bold">{header.text}</p>
                        )}
                        {header && header.format && header.format !== "TEXT" && (
                          <div className="bg-muted text-muted-foreground flex h-20 items-center justify-center rounded text-[11px] font-medium">
                            [{header.format}] Media Header
                          </div>
                        )}
                        {body?.text && <p className="whitespace-pre-wrap">{body.text}</p>}
                        {footer?.text && (
                          <p className="text-muted-foreground border-t pt-1 text-[10px]">
                            {footer.text}
                          </p>
                        )}
                      </div>

                      {buttonsComp?.buttons?.map((btn, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-center gap-1.5 rounded border bg-white px-2 py-1.5 text-xs font-semibold text-emerald-600 shadow-xs dark:bg-zinc-800 dark:text-emerald-400"
                        >
                          {btn.type === "URL" && <ExternalLinkIcon className="h-3 w-3" />}
                          {btn.type === "PHONE_NUMBER" && <PhoneCallIcon className="h-3 w-3" />}
                          <span>{btn.text}</span>
                        </div>
                      ))}

                      {carousel?.cards && carousel.cards.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pt-1">
                          {carousel.cards.map((card, cIdx) => {
                            const cBody = card.components.find((c) => c.type === "BODY");
                            return (
                              <div
                                key={cIdx}
                                className="min-w-[180px] rounded-lg border bg-white p-2 text-[11px] shadow-xs dark:bg-zinc-800"
                              >
                                <div className="bg-muted text-muted-foreground mb-1.5 flex h-14 items-center justify-center rounded text-[10px]">
                                  Card #{cIdx + 1} Media
                                </div>
                                {cBody?.text && <p className="whitespace-pre-wrap">{cBody.text}</p>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          <DialogFooter>
            {viewingTemplate &&
              viewingTemplate.status !== "SUBMITTED" &&
              viewingTemplate.status !== "PENDING" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const tpl = viewingTemplate;
                    setViewingTemplate(null);
                    setEditingTemplate(tpl);
                    setBuilderOpen(true);
                  }}
                >
                  <PencilIcon className="mr-1.5 h-3.5 w-3.5" />
                  Edit Template
                </Button>
              )}
            <Button onClick={() => setViewingTemplate(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingTemplate}
        onOpenChange={(open) => {
          if (!open) setDeletingTemplate(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete WhatsApp Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingTemplate?.name}</strong>?
              {deletingTemplate?.metaTemplateId
                ? " This will also delete the template from your Meta WhatsApp Business Account."
                : " This draft will be permanently removed."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTemplate(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
