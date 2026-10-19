/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type DefaultError,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";

export const DEFAULT_QUERY_CONFIG = {
  staleTime: 60 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export type QueryOverrides<TData = unknown, TError = DefaultError> = Partial<
  Omit<UseQueryOptions<any, TError, TData, any>, "queryKey" | "queryFn">
> & {
  queryKey?: QueryKey;
};

export function useAppQuery<TData = unknown, TError = DefaultError>(
  baseOptions: any,
  overrides?: QueryOverrides<TData, TError> | Record<string, unknown>,
): UseQueryResult<TData, TError> {
  const resolvedBase = typeof baseOptions === "function" ? baseOptions() : baseOptions;

  const mergedOptions = {
    ...DEFAULT_QUERY_CONFIG,
    ...resolvedBase,
    ...overrides,
  };

  return useQuery(mergedOptions as UseQueryOptions<any, TError, TData, any>);
}

export interface AppMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> extends UseMutationOptions<TData, TError, TVariables, TContext> {
  successMessage?: string | ((data: TData, variables: TVariables) => string);
  errorMessage?: string | ((error: TError) => string);
  invalidateKeys?: QueryKey[];
}

export type MutationOverrides<
  TData = unknown,
  TVariables = void,
  TError = DefaultError,
  TContext = unknown,
> = Partial<AppMutationOptions<TData, TError, TVariables, TContext>>;

export function useAppMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  baseOptions: any,
  overrides?: MutationOverrides<TData, TVariables, TError, TContext> | Record<string, unknown>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const queryClient = useQueryClient();

  const {
    successMessage,
    errorMessage,
    invalidateKeys,
    onSuccess: baseOnSuccess,
    onError: baseOnError,
    onSettled: baseOnSettled,
    ...restBase
  } = (baseOptions ?? {}) as AppMutationOptions<TData, TError, TVariables, TContext>;

  const {
    successMessage: overrideSuccessMessage,
    errorMessage: overrideErrorMessage,
    invalidateKeys: overrideInvalidateKeys,
    onSuccess: overrideOnSuccess,
    onError: overrideOnError,
    onSettled: overrideOnSettled,
    ...restOverrides
  } = (overrides ?? {}) as AppMutationOptions<TData, TError, TVariables, TContext>;

  const resolvedSuccessMessage = overrideSuccessMessage ?? successMessage;
  const resolvedErrorMessage = overrideErrorMessage ?? errorMessage;
  const keysToInvalidate = [...(invalidateKeys ?? []), ...(overrideInvalidateKeys ?? [])];

  return useMutation({
    ...restBase,
    ...restOverrides,
    onSuccess: (...args: any[]) => {
      if (keysToInvalidate?.length) {
        keysToInvalidate.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      (baseOnSuccess as any)?.(...args);
      (overrideOnSuccess as any)?.(...args);

      if (resolvedSuccessMessage) {
        const message =
          typeof resolvedSuccessMessage === "function"
            ? (resolvedSuccessMessage as any)(args[0], args[1])
            : resolvedSuccessMessage;
        if (message) {
          toast.success(message);
        }
      }
    },
    onError: (...args: any[]) => {
      (baseOnError as any)?.(...args);
      (overrideOnError as any)?.(...args);

      if (resolvedErrorMessage) {
        const message =
          typeof resolvedErrorMessage === "function"
            ? (resolvedErrorMessage as any)(args[0])
            : resolvedErrorMessage;
        if (message) {
          toast.error(message);
        }
      }
    },
    onSettled: (...args: any[]) => {
      (baseOnSettled as any)?.(...args);
      (overrideOnSettled as any)?.(...args);
    },
  }) as UseMutationResult<TData, TError, TVariables, TContext>;
}
