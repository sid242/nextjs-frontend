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
  Omit<UseQueryOptions<never, TError, TData, QueryKey>, "queryKey" | "queryFn">
> & {
  queryKey?: QueryKey;
};

export function useAppQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  baseOptions:
    | UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    | (() => UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | any,
  overrides?: QueryOverrides<TData, TError> | Record<string, unknown>,
): UseQueryResult<TData, TError> {
  const resolvedBase = typeof baseOptions === "function" ? baseOptions() : baseOptions;

  const mergedOptions = {
    ...DEFAULT_QUERY_CONFIG,
    ...resolvedBase,
    ...overrides,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  baseOptions:
    | AppMutationOptions<TData, TError, TVariables, TContext>
    | (() => AppMutationOptions<TData, TError, TVariables, TContext>)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | any,
  overrides?: MutationOverrides<TData, TVariables, TError, TContext> | Record<string, unknown>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const queryClient = useQueryClient();

  const resolvedBase = typeof baseOptions === "function" ? baseOptions() : baseOptions;

  const {
    successMessage,
    errorMessage,
    invalidateKeys,
    onSuccess: baseOnSuccess,
    onError: baseOnError,
    onSettled: baseOnSettled,
    ...restBase
  } = (resolvedBase ?? {}) as AppMutationOptions<TData, TError, TVariables, TContext>;

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

  const mutationOptions: UseMutationOptions<TData, TError, TVariables, TContext> = {
    ...restBase,
    ...restOverrides,
    onSuccess: (...args) => {
      if (keysToInvalidate?.length) {
        keysToInvalidate.forEach((key) => {
          void queryClient.invalidateQueries({ queryKey: key });
        });
      }

      if (typeof baseOnSuccess === "function") {
        (baseOnSuccess as (...a: unknown[]) => unknown)(...args);
      }
      if (typeof overrideOnSuccess === "function") {
        (overrideOnSuccess as (...a: unknown[]) => unknown)(...args);
      }

      if (resolvedSuccessMessage) {
        const message =
          typeof resolvedSuccessMessage === "function"
            ? (resolvedSuccessMessage as (data: unknown, variables: unknown) => string)(
                args[0],
                args[1],
              )
            : resolvedSuccessMessage;
        if (message) {
          toast.success(message);
        }
      }
    },
    onError: (...args) => {
      if (typeof baseOnError === "function") {
        (baseOnError as (...a: unknown[]) => unknown)(...args);
      }
      if (typeof overrideOnError === "function") {
        (overrideOnError as (...a: unknown[]) => unknown)(...args);
      }

      if (resolvedErrorMessage) {
        const message =
          typeof resolvedErrorMessage === "function"
            ? (resolvedErrorMessage as (error: unknown) => string)(args[0])
            : resolvedErrorMessage;
        if (message) {
          toast.error(message);
        }
      }
    },
    onSettled: (...args) => {
      if (typeof baseOnSettled === "function") {
        (baseOnSettled as (...a: unknown[]) => unknown)(...args);
      }
      if (typeof overrideOnSettled === "function") {
        (overrideOnSettled as (...a: unknown[]) => unknown)(...args);
      }
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useMutation(mutationOptions as any);
}
