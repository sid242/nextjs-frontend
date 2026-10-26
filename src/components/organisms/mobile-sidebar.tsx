"use client";

import { useState, type ReactNode } from "react";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarProvider } from "@/lib/context/sidebar-context";

import { SidebarNav } from "./sidebar-nav";

interface MobileSidebarProps {
  tenantSwitcher?: ReactNode;
  userProfile?: ReactNode;
  tenantBrand?: ReactNode;
}

export function MobileSidebar({ tenantSwitcher, userProfile, tenantBrand }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open mobile navigation drawer"
        >
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex h-full w-72 flex-col justify-between p-4">
        <SidebarProvider value={{ collapsed: false, toggle: () => setOpen(false), isMobile: true }}>
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <SheetHeader className="shrink-0 p-0 text-left">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Navigation menu and organization selector
              </SheetDescription>
              {tenantSwitcher ? (
                <div className="pt-1">{tenantSwitcher}</div>
              ) : (
                tenantBrand && (
                  <div className="flex items-center justify-between pb-2">{tenantBrand}</div>
                )
              )}
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto py-1 pr-1">
              <SidebarNav orientation="vertical" onNavigate={() => setOpen(false)} />
            </div>
          </div>

          {userProfile && (
            <div className="border-border/40 mt-auto shrink-0 border-t pt-3">{userProfile}</div>
          )}
        </SidebarProvider>
      </SheetContent>
    </Sheet>
  );
}
