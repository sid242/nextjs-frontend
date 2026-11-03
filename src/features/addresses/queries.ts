"use client";

import { queryOptions } from "@tanstack/react-query";

import { useAppMutation, useAppQuery, type MutationOverrides } from "@/lib/query/hooks";

import * as api from "./api";
import type { AddressScope } from "./api";
import { addressKeys } from "./keys";
import type { Address, AddressInput } from "./schemas";

export const addressesQueryOptions = (scope: AddressScope) =>
  queryOptions<Address[]>({
    queryKey: addressKeys.list(scope),
    queryFn: ({ signal }) => api.listAddresses(scope, signal),
  });

export function useAddresses(scope: AddressScope) {
  return useAppQuery<Address[]>(addressesQueryOptions(scope));
}

export function useCreateAddress(
  scope: AddressScope,
  options?: MutationOverrides<Address, AddressInput>,
) {
  return useAppMutation(
    {
      mutationFn: (body: AddressInput) => api.createAddress(scope, body),
      invalidateKeys: [addressKeys.all],
      successMessage: "Address added successfully",
      errorMessage: "Could not add address",
    },
    options,
  );
}

export function useUpdateAddress(
  scope: AddressScope,
  options?: MutationOverrides<Address, { id: string; body: Partial<AddressInput> }>,
) {
  return useAppMutation(
    {
      mutationFn: ({ id, body }: { id: string; body: Partial<AddressInput> }) =>
        api.updateAddress(scope, id, body),
      invalidateKeys: [addressKeys.all],
      successMessage: "Address updated successfully",
      errorMessage: "Could not update address",
    },
    options,
  );
}

export function useDeleteAddress(scope: AddressScope, options?: MutationOverrides<void, string>) {
  return useAppMutation(
    {
      mutationFn: (id: string) => api.deleteAddress(scope, id),
      invalidateKeys: [addressKeys.all],
      successMessage: "Address deleted successfully",
      errorMessage: "Could not delete address",
    },
    options,
  );
}

export function useSetDefaultAddress(
  scope: AddressScope,
  options?: MutationOverrides<Address, string>,
) {
  return useAppMutation(
    {
      mutationFn: (id: string) => api.setDefaultAddress(scope, id),
      invalidateKeys: [addressKeys.all],
      successMessage: "Default address updated",
      errorMessage: "Could not set default address",
    },
    options,
  );
}
