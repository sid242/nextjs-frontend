"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDownIcon,
  CircleIcon,
  FolderIcon,
  LayoutDashboardIcon,
  MailIcon,
  PaletteIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  navSections as defaultNavSections,
  type NavIcon,
  type NavItem,
  type NavSection,
} from "@/config/site";
import { cn } from "@/lib/utils";

const ICONS: Record<NavIcon, LucideIcon> = {
  "layout-dashboard": LayoutDashboardIcon,
  users: UsersIcon,
  "shield-check": ShieldCheckIcon,
  palette: PaletteIcon,
  mail: MailIcon,
  folder: FolderIcon,
  "scroll-text": ScrollTextIcon,
  settings: SettingsIcon,
  circle: CircleIcon,
};

function isPathActive(href: string | undefined, pathname: string): boolean {
  if (!href) return false;
  if (pathname === href) return true;
  if (href !== "/" && href !== "/dashboard" && pathname.startsWith(`${href}/`)) {
    return true;
  }
  return false;
}

function hasActiveDescendant(item: NavItem, pathname: string): boolean {
  if (isPathActive(item.href, pathname)) return true;
  if (item.items && item.items.length > 0) {
    return item.items.some((child) => hasActiveDescendant(child, pathname));
  }
  return false;
}

function checkPermission(item: NavItem, userPermissions?: string[]): boolean {
  if (!userPermissions) return true;
  if (!item.permission) return true;
  if (userPermissions.includes("*")) return true;
  if (Array.isArray(item.permission)) {
    return item.permission.some((p) => userPermissions.includes(p));
  }
  return userPermissions.includes(item.permission);
}

interface SidebarNavProps {
  orientation?: "vertical" | "horizontal";
  /** Icon-only mode. Labels stay in the DOM (sr-only) so the links remain accessible. */
  collapsed?: boolean;
  onNavigate?: () => void;
  sections?: NavSection[];
  permissions?: string[];
}

export function SidebarNav({
  orientation = "vertical",
  collapsed = false,
  onNavigate,
  sections = defaultNavSections,
  permissions,
}: SidebarNavProps) {
  const pathname = usePathname();
  // Track user manual toggle overrides without needing an effect
  const [toggledItems, setToggledItems] = useState<Record<string, boolean>>({});

  const filteredSections = useMemo(() => {
    if (!permissions) return sections;
    return sections
      .map((section) => {
        const items = (section?.items ?? [])
          .map((item) => {
            if (item?.items && item.items.length > 0) {
              const childItems = item.items.filter((child) => checkPermission(child, permissions));
              if (childItems.length === 0) return null;
              return { ...item, items: childItems };
            }
            return checkPermission(item, permissions) ? item : null;
          })
          .filter((item): item is NavItem => item !== null);

        if (items.length === 0) return null;
        return { ...section, items };
      })
      .filter((section): section is NavSection => section !== null);
  }, [sections, permissions]);

  const toggleItem = (key: string, currentlyOpen: boolean) => {
    setToggledItems((prev) => ({
      ...prev,
      [key]: !currentlyOpen,
    }));
  };

  if (orientation === "horizontal") {
    // Flattened horizontal bar for top navigation if requested
    const flatItems = filteredSections?.flatMap((s) => s?.items ?? []) ?? [];
    return (
      <nav aria-label="Main" className="flex items-center gap-1 overflow-x-auto py-1">
        {flatItems.map((item) => {
          const Icon = item?.icon ? (ICONS[item.icon] ?? CircleIcon) : CircleIcon;
          const active = hasActiveDescendant(item, pathname);
          return (
            <Link
              key={item.href ?? item.title}
              href={item.href ?? "#"}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "hover:bg-accent/80 hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Main" className="flex flex-col gap-4">
      {filteredSections?.map((section, sIdx) => {
        const hasSectionTitle = Boolean(section?.title);

        return (
          <div key={section?.title ?? `section-${sIdx}`} className="flex flex-col gap-1">
            {/* Section Heading or Divider */}
            {collapsed
              ? sIdx > 0 && <div className="border-border/40 mx-1 my-1.5 border-t" />
              : hasSectionTitle && (
                  <div
                    className={cn(
                      "text-muted-foreground/70 px-3 text-[11px] font-semibold tracking-wider uppercase select-none",
                      sIdx === 0 ? "pt-1 pb-1" : "pt-3 pb-1",
                    )}
                  >
                    {section.title}
                  </div>
                )}

            {/* Section Items */}
            <div className="flex flex-col gap-1">
              {section?.items?.map((item, iIdx) => {
                const itemKey = `${sIdx}-${iIdx}-${item.title}`;
                const hasChildren = Boolean(item?.items && item.items.length > 0);
                const isChildActive = hasActiveDescendant(item, pathname);
                const active = isPathActive(item?.href, pathname);
                const isOpen = toggledItems?.[itemKey] ?? (isChildActive || active);
                const Icon = item?.icon ? (ICONS[item.icon] ?? CircleIcon) : CircleIcon;

                // 1. COLLAPSED VIEW (Icon-only mode)
                if (collapsed) {
                  if (hasChildren) {
                    return (
                      <DropdownMenu key={itemKey}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                aria-label={item.title}
                                className={cn(
                                  "hover:bg-accent/80 hover:text-accent-foreground relative mx-auto flex size-9 cursor-pointer items-center justify-center rounded-md text-sm font-medium transition-all duration-150",
                                  isChildActive || active
                                    ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                                    : "text-muted-foreground",
                                )}
                              >
                                {(isChildActive || active) && (
                                  <span className="bg-primary absolute top-1.5 bottom-1.5 left-0 w-1 rounded-r-full" />
                                )}
                                <Icon className="size-4 shrink-0" />
                                <span className="sr-only">{item.title}</span>
                              </button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="right">{item.title}</TooltipContent>
                        </Tooltip>

                        <DropdownMenuContent
                          side="right"
                          sideOffset={12}
                          className="min-w-48 p-1.5 shadow-lg"
                        >
                          <DropdownMenuLabel className="text-muted-foreground px-2 py-1 text-xs font-semibold tracking-wider uppercase">
                            {item.title}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {item?.items?.map((subItem) => {
                            const subActive = isPathActive(subItem?.href, pathname);
                            const SubIcon = subItem?.icon ? ICONS[subItem.icon] : null;

                            return (
                              <DropdownMenuItem key={subItem?.href ?? subItem?.title} asChild>
                                <Link
                                  href={subItem?.href ?? "#"}
                                  onClick={onNavigate}
                                  className={cn(
                                    "flex cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-xs font-medium",
                                    subActive
                                      ? "bg-accent text-accent-foreground font-semibold"
                                      : "text-muted-foreground hover:text-foreground",
                                  )}
                                >
                                  {SubIcon ? (
                                    <SubIcon className="size-3.5 shrink-0" />
                                  ) : (
                                    <span
                                      className={cn(
                                        "size-1.5 shrink-0 rounded-full",
                                        subActive ? "bg-primary" : "bg-muted-foreground/40",
                                      )}
                                    />
                                  )}
                                  <span className="flex-1 truncate">{subItem.title}</span>
                                  {subItem?.badge != null && (
                                    <span className="bg-muted text-muted-foreground ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                                      {subItem.badge}
                                    </span>
                                  )}
                                </Link>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }

                  // Collapsed single link
                  return (
                    <Tooltip key={itemKey}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href ?? "#"}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "hover:bg-accent/80 hover:text-accent-foreground relative mx-auto flex size-9 items-center justify-center rounded-md text-sm font-medium transition-all duration-150",
                            active
                              ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                              : "text-muted-foreground",
                            item.disabled && "pointer-events-none opacity-50",
                          )}
                        >
                          {active && (
                            <span className="bg-primary absolute top-1.5 bottom-1.5 left-0 w-1 rounded-r-full" />
                          )}
                          <Icon className="size-4 shrink-0" />
                          <span className="sr-only">{item.title}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="flex items-center gap-2">
                          <span>{item.title}</span>
                          {item.badge != null && (
                            <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                // 2. EXPANDED VIEW (Standard sidebar mode)
                if (hasChildren) {
                  return (
                    <div key={itemKey} className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => toggleItem(itemKey, isOpen)}
                        aria-expanded={isOpen}
                        className={cn(
                          "group hover:bg-accent/80 hover:text-accent-foreground relative flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-all duration-150 select-none",
                          isChildActive || active
                            ? "text-foreground font-semibold"
                            : "text-muted-foreground",
                        )}
                      >
                        <Icon className="group-hover:text-foreground size-4 shrink-0 transition-colors" />
                        <span className="flex-1 truncate">{item.title}</span>
                        {item.badge != null && (
                          <span className="bg-muted text-muted-foreground mr-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                            {item.badge}
                          </span>
                        )}
                        <ChevronDownIcon
                          className={cn(
                            "text-muted-foreground/70 size-3.5 shrink-0 transition-transform duration-200",
                            isOpen ? "rotate-0" : "-rotate-90",
                          )}
                        />
                      </button>

                      {isOpen && (
                        <div className="border-border/60 mt-1 mb-1 ml-5 flex flex-col gap-0.5 border-l pl-2.5">
                          {item?.items?.map((subItem) => {
                            const subActive = isPathActive(subItem.href, pathname);
                            const SubIcon = subItem.icon ? ICONS[subItem.icon] : null;

                            return (
                              <Link
                                key={subItem.href ?? subItem.title}
                                href={subItem.href ?? "#"}
                                onClick={onNavigate}
                                aria-current={subActive ? "page" : undefined}
                                className={cn(
                                  "group hover:bg-accent/80 hover:text-accent-foreground relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
                                  subActive
                                    ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                                    : "text-muted-foreground",
                                  subItem.disabled && "pointer-events-none opacity-50",
                                )}
                              >
                                {subActive && (
                                  <span className="bg-primary absolute top-1 bottom-1 -left-[11px] w-0.5 rounded-r-full" />
                                )}
                                {SubIcon ? (
                                  <SubIcon className="size-3.5 shrink-0" />
                                ) : (
                                  <span
                                    className={cn(
                                      "size-1.5 shrink-0 rounded-full transition-colors",
                                      subActive
                                        ? "bg-primary"
                                        : "bg-muted-foreground/40 group-hover:bg-foreground/60",
                                    )}
                                  />
                                )}
                                <span className="flex-1 truncate">{subItem.title}</span>
                                {subItem.badge != null && (
                                  <span className="bg-muted text-muted-foreground ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                                    {subItem.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Expanded single link
                return (
                  <Link
                    key={itemKey}
                    href={item.href ?? "#"}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group hover:bg-accent/80 hover:text-accent-foreground relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                        : "text-muted-foreground",
                      item.disabled && "pointer-events-none opacity-50",
                    )}
                  >
                    {active && (
                      <span className="bg-primary absolute top-1.5 bottom-1.5 left-0 w-1 rounded-r-full" />
                    )}
                    <Icon className="group-hover:text-foreground size-4 shrink-0 transition-colors" />
                    <span className="flex-1 truncate">{item.title}</span>
                    {item.badge != null && (
                      <span className="bg-muted text-muted-foreground ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
