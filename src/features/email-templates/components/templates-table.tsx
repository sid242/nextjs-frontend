"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArchiveIcon,
  CheckCircleIcon,
  ClockIcon,
  EditIcon,
  EyeIcon,
  MailIcon,
  MoreVerticalIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";

import { ColumnConfigDropdown } from "@/components/molecules/column-config-dropdown";
import { TablePagination } from "@/components/molecules/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDebouncedCallback,
  useSearchQueryParams,
  useTableColumns,
  type TableColumnDef,
} from "@/lib/hooks";

import { CATEGORY_LABELS, STATUS_COLORS } from "../constants";
import { useDeleteEmailTemplate, useEmailTemplates } from "../queries";
import type { EmailTemplate, EmailTemplateCategory, EmailTemplateStatus } from "../types";
import { TestSendDialog } from "./test-send-dialog";

type TemplateColumnId =
  "name" | "subject" | "category" | "status" | "variables" | "updatedAt" | "actions";

const TEMPLATE_COLUMNS: TableColumnDef<TemplateColumnId>[] = [
  { id: "name", label: "Template & Slug", canHide: false, defaultVisible: true },
  { id: "subject", label: "Subject Line", canHide: true, defaultVisible: true },
  { id: "category", label: "Category", canHide: true, defaultVisible: true },
  { id: "status", label: "Status", canHide: true, defaultVisible: true },
  { id: "variables", label: "Variables", canHide: true, defaultVisible: true },
  { id: "updatedAt", label: "Updated", canHide: true, defaultVisible: true },
  { id: "actions", label: "Actions", canHide: false, defaultVisible: true },
];

const TEMPLATE_COLUMN_LABELS: Record<TemplateColumnId, string> = {
  name: "Template & Slug",
  subject: "Subject Line",
  category: "Category",
  status: "Status",
  variables: "Variables",
  updatedAt: "Updated",
  actions: "Actions",
};

export function TemplatesTable() {
  const router = useRouter();
  const { get, getNumber, setParam, setParams } = useSearchQueryParams();
  const [searchInput, setSearchInput] = useState<string>(() => get("q") ?? "");

  const syncSearchParam = useDebouncedCallback((val: string) => {
    setParams({ q: val.trim() || null, page: null }, { mode: "replace", scroll: false });
  }, 250);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e?.target?.value ?? "";
    setSearchInput(val);
    syncSearchParam.run(val);
  };

  const categoryFilter = get("category") ?? "ALL";
  const statusFilter = get("status") ?? "ALL";

  const handleCategoryChange = (val: string) => {
    setParams(
      { category: val === "ALL" ? null : val, page: null },
      { mode: "replace", scroll: false },
    );
  };

  const handleStatusChange = (val: string) => {
    setParams(
      { status: val === "ALL" ? null : val, page: null },
      { mode: "replace", scroll: false },
    );
  };

  const [testSendOpen, setTestSendOpen] = useState(false);
  const [testSendTemplate, setTestSendTemplate] = useState<EmailTemplate | null>(null);

  const tableColumns = useTableColumns({
    columns: TEMPLATE_COLUMNS,
    tableId: "email_templates_table",
  });

  const { data, isLoading } = useEmailTemplates({
    search: (get("q") ?? searchInput).trim() || undefined,
    category: categoryFilter !== "ALL" ? (categoryFilter as EmailTemplateCategory) : undefined,
    status: statusFilter !== "ALL" ? (statusFilter as EmailTemplateStatus) : undefined,
  });

  const deleteMutation = useDeleteEmailTemplate();

  const handleTestSend = (tpl: EmailTemplate) => {
    setTestSendTemplate(tpl);
    setTestSendOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete email template "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const templates = useMemo(() => data?.templates ?? [], [data?.templates]);

  const rawPage = getNumber("page", 1) ?? 1;
  const page = Math.max(1, rawPage);
  const rawLimit = getNumber("limit", 10) ?? 10;
  const pageSize = [10, 20, 50].includes(rawLimit) ? rawLimit : 10;

  const handlePageSizeChange = (newSize: number) => {
    setParams(
      { limit: newSize === 10 ? null : newSize, page: null },
      { mode: "replace", scroll: false },
    );
  };

  const totalPages = Math.max(1, Math.ceil(templates.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedTemplates = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return templates.slice(start, start + pageSize);
  }, [templates, safePage, pageSize]);

  const getHeaderClass = (id: TemplateColumnId) => {
    switch (id) {
      case "name":
        return "w-[240px] min-w-[200px]";
      case "subject":
        return "min-w-[220px]";
      case "category":
        return "w-[120px] min-w-[110px]";
      case "status":
        return "w-[110px] min-w-[100px]";
      case "variables":
        return "w-[130px] min-w-[120px]";
      case "updatedAt":
        return "w-[110px] min-w-[100px]";
      case "actions":
        return "w-[80px] text-right";
    }
  };

  const renderCell = (colId: TemplateColumnId, tpl: EmailTemplate) => {
    switch (colId) {
      case "name":
        return (
          <TableCell key={colId} className="font-medium">
            <Link
              href={`/email-templates/${tpl?.id}`}
              className="group flex flex-col focus:outline-none"
            >
              <span className="text-foreground group-hover:text-primary text-sm font-semibold transition-colors">
                {tpl?.name}
              </span>
              <span className="text-muted-foreground font-mono text-[11px]">/{tpl?.slug}</span>
            </Link>
          </TableCell>
        );

      case "subject":
        return (
          <TableCell key={colId}>
            <span className="text-foreground/90 line-clamp-1 text-xs" title={tpl?.subject}>
              {tpl?.subject}
            </span>
          </TableCell>
        );

      case "category":
        return (
          <TableCell key={colId}>
            <Badge variant="outline" className="text-[11px] font-normal">
              {CATEGORY_LABELS[tpl?.category] || tpl?.category}
            </Badge>
          </TableCell>
        );

      case "status": {
        const statusStyle = STATUS_COLORS[tpl?.status] ??
          STATUS_COLORS.DRAFT ?? {
            bg: "bg-muted",
            text: "text-muted-foreground",
            border: "border-border",
          };
        return (
          <TableCell key={colId}>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
            >
              {tpl?.status === "PUBLISHED" && <CheckCircleIcon className="size-3" />}
              {tpl?.status === "DRAFT" && <ClockIcon className="size-3" />}
              {tpl?.status === "ARCHIVED" && <ArchiveIcon className="size-3" />}
              <span>{tpl?.status}</span>
            </span>
          </TableCell>
        );
      }

      case "variables":
        return (
          <TableCell key={colId}>
            <div className="flex flex-wrap gap-1">
              {tpl?.variables && tpl?.variables?.length > 0 ? (
                <>
                  <Badge variant="secondary" className="h-5 px-1.5 font-mono text-[10px]">
                    {tpl?.variables?.length} vars
                  </Badge>
                  {tpl?.variables?.slice(0, 2).map((v) => (
                    <span key={v} className="text-muted-foreground font-mono text-[10px]">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </>
              ) : (
                <span className="text-muted-foreground text-xs italic">None</span>
              )}
            </div>
          </TableCell>
        );

      case "updatedAt":
        return (
          <TableCell key={colId} className="text-muted-foreground text-xs">
            {tpl?.updatedAt ? new Date(tpl.updatedAt).toLocaleDateString() : "—"}
          </TableCell>
        );

      case "actions":
        return (
          <TableCell key={colId} className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVerticalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 text-xs">
                <DropdownMenuItem
                  onClick={() => router.push(`/email-templates/${tpl.id}`)}
                  className="gap-2"
                >
                  <EyeIcon className="text-muted-foreground size-3.5" />
                  <span>View &amp; Preview</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTestSend(tpl)} className="gap-2">
                  <SendIcon className="text-primary size-3.5" />
                  <span>Test Send</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/email-templates/${tpl.id}/edit`)}
                  className="gap-2"
                >
                  <EditIcon className="text-muted-foreground size-3.5" />
                  <span>Edit in Studio</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(tpl.id, tpl.name)}
                  className="text-destructive focus:text-destructive gap-2"
                >
                  <Trash2Icon className="size-3.5" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Email Templates</h2>
          <p className="text-muted-foreground text-xs">
            Create, manage, and dispatch responsive email templates with dynamic merge variables
          </p>
        </div>
        <Button asChild className="gap-1.5 shadow-sm">
          <Link href="/email-templates/new">
            <PlusIcon className="size-4" />
            <span>New Email Template</span>
          </Link>
        </Button>
      </div>

      {/* Filter and Search Bar (Fully Responsive) */}
      <div className="border-border bg-card flex flex-col gap-2.5 rounded-lg border p-3 sm:flex-row sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search templates by name, slug or subject..."
            className="h-9 pl-8 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-9 w-full text-xs sm:w-[150px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="MARKETING">Marketing</SelectItem>
              <SelectItem value="TRANSACTIONAL">Transactional</SelectItem>
              <SelectItem value="NOTIFICATION">Notification</SelectItem>
              <SelectItem value="CUSTOM">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-9 w-full text-xs sm:w-[130px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>

          <ColumnConfigDropdown tableColumns={tableColumns} />
        </div>
      </div>

      {/* Table Container with Horizontal Scroll Container */}
      <div className="border-border bg-card overflow-hidden rounded-lg border shadow-xs">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-2 p-12">
            <Spinner className="text-primary size-6" />
            <span className="text-muted-foreground text-xs">Loading templates...</span>
          </div>
        ) : templates?.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3 p-12 text-center">
            <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
              <MailIcon className="size-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">No email templates found</h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {searchInput || categoryFilter !== "ALL" || statusFilter !== "ALL"
                  ? "Try adjusting your search query or filters"
                  : "Get started by creating your first personalized email template"}
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-2 gap-1.5">
              <Link href="/email-templates/new">
                <PlusIcon className="size-3.5" />
                <span>Create Template</span>
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    {tableColumns.orderedVisibleColumns?.map((colId) => (
                      <TableHead key={colId} className={getHeaderClass(colId)}>
                        {TEMPLATE_COLUMN_LABELS[colId]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTemplates?.map((tpl) => (
                    <TableRow key={tpl?.id} className="hover:bg-muted/30 transition-colors">
                      {tableColumns.orderedVisibleColumns?.map((colId) => renderCell(colId, tpl))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <TablePagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={templates.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]}
              onPageSizeChange={handlePageSizeChange}
              onPageChange={(p) =>
                setParam("page", p <= 1 ? null : p, { mode: "replace", scroll: false })
              }
              itemLabel="email templates"
            />
          </>
        )}
      </div>

      {/* Test Send Dialog */}
      <TestSendDialog
        template={testSendTemplate}
        open={testSendOpen}
        onOpenChange={setTestSendOpen}
      />
    </div>
  );
}
