"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderIcon,
  LayoutDashboardIcon,
  MailIcon,
  PaletteIcon,
  ScrollTextIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface SearchItem {
  title: string;
  href: string;
  category: "Navigation" | "Settings";
  icon: typeof LayoutDashboardIcon;
  description: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    category: "Navigation",
    icon: LayoutDashboardIcon,
    description: "Overview metrics, summary, and recent activity",
  },
  {
    title: "Team Members",
    href: "/team",
    category: "Navigation",
    icon: UsersIcon,
    description: "Manage team users, invitations, and access",
  },
  {
    title: "Roles & Permissions",
    href: "/roles",
    category: "Navigation",
    icon: ShieldCheckIcon,
    description: "Configure dynamic RBAC roles and permissions",
  },
  {
    title: "White-Label Branding",
    href: "/branding",
    category: "Settings",
    icon: PaletteIcon,
    description: "Customize company logo, theme colors, and domain",
  },
  {
    title: "SMTP Configuration",
    href: "/settings/email",
    category: "Settings",
    icon: MailIcon,
    description: "Custom mail server settings and delivery testing",
  },
  {
    title: "Files & Storage",
    href: "/files",
    category: "Navigation",
    icon: FolderIcon,
    description: "Browse uploaded documents, assets, and files",
  },
  {
    title: "Audit Logs",
    href: "/audit-logs",
    category: "Settings",
    icon: ScrollTextIcon,
    description: "Security events, user actions, and compliance stream",
  },
  {
    title: "Account Settings",
    href: "/settings",
    category: "Settings",
    icon: SettingsIcon,
    description: "Profile preferences, password, and security",
  },
];

export function GlobalSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 120);
  const router = useRouter();

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

  const filteredItems = SEARCH_ITEMS.filter((item) => {
    const search = debouncedQuery.trim().toLowerCase();
    if (!search) return true;
    return (
      item.title.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search)
    );
  });

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
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
        <span className="truncate">Search dashboard…</span>
        <kbd className="bg-background text-muted-foreground pointer-events-none absolute top-2 right-2 hidden h-5 items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] font-medium sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg overflow-hidden p-0 shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Quick Search</DialogTitle>
          </DialogHeader>

          <div className="flex items-center border-b px-3 py-2.5">
            <SearchIcon className="text-muted-foreground mr-2 size-4 shrink-0" />
            <Input
              value={query}
              onChange={(e) => setQuery(e?.target?.value ?? "")}
              placeholder="Search pages, settings, tools..."
              className="h-9 border-0 text-sm shadow-none focus-visible:ring-0"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {filteredItems.length === 0 ? (
              <div className="text-muted-foreground p-6 text-center text-sm">
                No matching results found for &ldquo;{query}&rdquo;.
              </div>
            ) : (
              <div className="grid gap-1">
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleSelect(item.href)}
                      className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors"
                    >
                      <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                        <Icon className="size-4" />
                      </div>
                      <div className="grid flex-1 leading-tight">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground text-sm font-semibold">
                            {item.title}
                          </span>
                          <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
                            {item.category}
                          </span>
                        </div>
                        <span className="text-muted-foreground truncate text-xs font-normal">
                          {item.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-muted/40 text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-[11px]">
            <span>Navigate with click or arrow keys</span>
            <span>ESC to close</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
