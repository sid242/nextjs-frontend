"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  FileTextIcon,
  FolderIcon,
  LayoutDashboardIcon,
  Loader2Icon,
  MailIcon,
  PaletteIcon,
  ScrollTextIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/http";
import { useDebouncedValue } from "@/lib/hooks";
import { useTenantHref } from "@/lib/tenancy/use-tenant-href";
import { cn } from "@/lib/utils";

export type SearchCategory =
  "Pages" | "Actions" | "Members" | "Files" | "Roles" | "Groups" | "Templates";

export interface SearchItem {
  id: string;
  title: string;
  subtitle?: string | null;
  category: SearchCategory;
  href: string;
  icon?: string;
}

export interface SearchResult {
  query: string;
  total: number;
  results: SearchItem[];
}

const DEFAULT_ITEMS: SearchItem[] = [
  {
    id: "default-dashboard",
    title: "Dashboard",
    subtitle: "Overview metrics, summary, and recent activity",
    category: "Pages",
    href: "/dashboard",
  },
  {
    id: "default-team",
    title: "Team Members",
    subtitle: "Manage team users, invitations, and access",
    category: "Pages",
    href: "/team",
  },
  {
    id: "default-roles",
    title: "Roles & Permissions",
    subtitle: "Configure dynamic RBAC roles and permissions",
    category: "Pages",
    href: "/roles",
  },
  {
    id: "default-files",
    title: "Files & Storage",
    subtitle: "Browse uploaded documents, assets, and files",
    category: "Pages",
    href: "/files",
  },
  {
    id: "default-branding",
    title: "White-Label Branding",
    subtitle: "Customize company logo, theme colors, and domain",
    category: "Pages",
    href: "/settings/branding",
  },
  {
    id: "default-invite",
    title: "Invite Member",
    subtitle: "Quick action: send workspace invitation",
    category: "Actions",
    href: "/team?action=invite",
  },
];

function getCategoryIcon(category: SearchCategory, iconName?: string) {
  if (category === "Actions") return ZapIcon;
  if (category === "Members") return UsersIcon;
  if (category === "Files") return FileTextIcon;
  if (category === "Roles") return ShieldCheckIcon;
  if (category === "Groups") return FolderIcon;
  if (category === "Templates") return MailIcon;

  if (iconName === "palette") return PaletteIcon;
  if (iconName === "scroll") return ScrollTextIcon;
  if (iconName === "settings") return SettingsIcon;
  return LayoutDashboardIcon;
}

export function GlobalSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debouncedQuery = useDebouncedValue(query, 120);
  const router = useRouter();
  const tenantHref = useTenantHref();

  const cleanQuery = debouncedQuery.trim().toLowerCase();

  const { data: searchData, isLoading } = useQuery<SearchResult>({
    queryKey: ["global-search", cleanQuery],
    queryFn: async ({ signal }) => {
      const encoded = encodeURIComponent(cleanQuery);
      return api.get<SearchResult>(`/search?q=${encoded}&limit=20`, { signal });
    },
    enabled: cleanQuery.length >= 1,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const items = useMemo(() => {
    if (cleanQuery) {
      return searchData?.results ?? [];
    }
    return DEFAULT_ITEMS;
  }, [cleanQuery, searchData?.results]);

  const safeSelectedIndex = selectedIndex >= items.length ? 0 : selectedIndex;

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    const targetUrl = tenantHref(href);
    router.push(targetUrl);
  };

  const handleDialogKeyDown = (e: React.KeyboardEvent) => {
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = items[safeSelectedIndex];
      if (current) handleSelect(current.href);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={cn(
          "bg-muted/40 hover:bg-muted/70 text-muted-foreground relative h-9 w-40 justify-start rounded-md px-3 text-xs sm:w-60 md:w-64",
          className,
        )}
      >
        <SearchIcon className="mr-2 size-3.5 shrink-0" />
        <span className="truncate">Search workspace…</span>
        <kbd className="bg-background text-muted-foreground pointer-events-none absolute top-2 right-2 hidden h-5 items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] font-medium sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-xl overflow-hidden p-0 shadow-2xl"
          onKeyDown={handleDialogKeyDown}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Quick Search</DialogTitle>
          </DialogHeader>

          <div className="flex items-center border-b px-3 py-2.5">
            <SearchIcon className="text-muted-foreground mr-2 size-4 shrink-0" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e?.target?.value ?? "");
                setSelectedIndex(0);
              }}
              placeholder="Search members, files, roles, templates, pages..."
              className="h-9 border-0 text-sm shadow-none focus-visible:ring-0"
              autoFocus
            />
            {isLoading && (
              <Loader2Icon className="text-muted-foreground size-4 shrink-0 animate-spin" />
            )}
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {items.length === 0 ? (
              <div className="text-muted-foreground p-6 text-center text-sm">
                No matching results found for &ldquo;{query}&rdquo;.
              </div>
            ) : (
              <div className="grid gap-1">
                {items.map((item, idx) => {
                  const Icon = getCategoryIcon(item.category, item.icon);
                  const isSelected = idx === safeSelectedIndex;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.href)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/50 text-foreground",
                      )}
                    >
                      <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                        <Icon className="size-4" />
                      </div>
                      <div className="grid flex-1 leading-tight">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground truncate text-sm font-semibold">
                            {item.title}
                          </span>
                          <Badge
                            variant="secondary"
                            className="px-1.5 py-0 text-[10px] tracking-wider uppercase"
                          >
                            {item.category}
                          </Badge>
                        </div>
                        {item.subtitle && (
                          <span className="text-muted-foreground truncate text-xs font-normal">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-muted/40 text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-[11px]">
            <span>Navigate with ↑↓, Enter to select</span>
            <span>ESC to close</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
