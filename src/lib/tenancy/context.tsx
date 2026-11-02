"use client";

import React, { createContext, useContext } from "react";

import { type TenantUrlContextValue } from "./urls";

const TenantUrlContext = createContext<TenantUrlContextValue | null>(null);

export interface TenantUrlProviderProps {
  value: TenantUrlContextValue;
  children: React.ReactNode;
}

export function TenantUrlProvider({ value, children }: TenantUrlProviderProps) {
  return <TenantUrlContext.Provider value={value}>{children}</TenantUrlContext.Provider>;
}

export function useTenantUrl(): TenantUrlContextValue | null {
  return useContext(TenantUrlContext);
}

export { useTenantHref } from "./use-tenant-href";
