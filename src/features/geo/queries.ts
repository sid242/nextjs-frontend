import { queryOptions, useQuery } from "@tanstack/react-query";

import * as api from "./api";
import { geoKeys } from "./keys";
import type { GeoItem, GeoPointLookup, PinDetails } from "./types";

const STALE_TIME_24H = 1000 * 60 * 60 * 24;

export const statesQueryOptions = () =>
  queryOptions<GeoItem[]>({
    queryKey: geoKeys.states(),
    queryFn: ({ signal }) => api.getStates(signal),
    staleTime: STALE_TIME_24H,
  });

export const childrenQueryOptions = (parentId?: number | null, level?: number | null, q?: string) =>
  queryOptions<GeoItem[]>({
    queryKey: geoKeys.children(parentId, level, q),
    queryFn: ({ signal }) => {
      if (!parentId || !level) return Promise.resolve([]);
      return api.getChildren(parentId, level, q, signal);
    },
    enabled: Boolean(parentId && level),
    staleTime: STALE_TIME_24H,
  });

export const pinQueryOptions = (pin?: string) =>
  queryOptions<PinDetails | null>({
    queryKey: geoKeys.pin(pin ?? ""),
    queryFn: ({ signal }) => {
      if (!pin || !/^[1-9]\d{5}$/.test(pin)) return Promise.resolve(null);
      return api.lookupPin(pin, signal);
    },
    enabled: Boolean(pin && /^[1-9]\d{5}$/.test(pin)),
    staleTime: STALE_TIME_24H,
  });

export const pointLookupQueryOptions = (lat?: number | null, lng?: number | null) =>
  queryOptions<GeoPointLookup[]>({
    queryKey: geoKeys.point(lat ?? 0, lng ?? 0),
    queryFn: ({ signal }) => {
      if (lat === undefined || lat === null || lng === undefined || lng === null) {
        return Promise.resolve([]);
      }
      return api.lookupPoint(lat, lng, signal);
    },
    enabled: lat !== undefined && lat !== null && lng !== undefined && lng !== null,
    staleTime: STALE_TIME_24H,
  });

export function useGeoStates() {
  return useQuery(statesQueryOptions());
}

export function useGeoChildren(
  parentId?: number | null,
  level?: number | null,
  q?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    ...childrenQueryOptions(parentId, level, q),
    enabled: Boolean(parentId && level && (options?.enabled ?? true)),
  });
}

export function useGeoPin(pin?: string, options?: { enabled?: boolean }) {
  return useQuery({
    ...pinQueryOptions(pin),
    enabled: Boolean(pin && /^[1-9]\d{5}$/.test(pin) && (options?.enabled ?? true)),
  });
}
