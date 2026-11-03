import type { AddressScope } from "./api";

const all = ["addresses"] as const;

export const addressKeys = {
  all,
  list: (scope: AddressScope) => [...all, "list", scope] as const,
  detail: (scope: AddressScope, id: string) => [...all, "detail", scope, id] as const,
};
