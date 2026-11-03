import { api } from "@/lib/api/http";

import type { Address, AddressInput } from "./schemas";

export type AddressScope =
  { kind: "me" } | { kind: "workspace" } | { kind: "member"; memberId: string };

const base = (s: AddressScope) =>
  s.kind === "me"
    ? "/addresses/me"
    : s.kind === "workspace"
      ? "/addresses/workspace"
      : `/addresses/members/${s.memberId}`;

export const listAddresses = (s: AddressScope, signal?: AbortSignal) =>
  api.get<Address[]>(base(s), { signal });

export const getAddress = (s: AddressScope, id: string, signal?: AbortSignal) =>
  api.get<Address>(`${base(s)}/${id}`, { signal });

export const createAddress = (s: AddressScope, body: AddressInput) =>
  api.post<Address>(base(s), body);

export const updateAddress = (s: AddressScope, id: string, body: Partial<AddressInput>) =>
  api.patch<Address>(`${base(s)}/${id}`, body);

export const deleteAddress = (s: AddressScope, id: string) => api.delete(`${base(s)}/${id}`);

export const setDefaultAddress = (s: AddressScope, id: string) =>
  api.post<Address>(`${base(s)}/${id}/default`);
