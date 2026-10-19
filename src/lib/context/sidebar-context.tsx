"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
  isMobile?: boolean;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggle: () => {},
  isMobile: false,
});

export function SidebarProvider({
  value,
  children,
}: {
  value: SidebarContextValue;
  children: ReactNode;
}) {
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  return useContext(SidebarContext);
}
