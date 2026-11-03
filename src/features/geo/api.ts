import { api } from "@/lib/api/http";

import type { GeoItem, GeoPointLookup, PinDetails } from "./types";

export const getStates = (signal?: AbortSignal): Promise<GeoItem[]> =>
  api.get<GeoItem[]>("/geo/states", { signal });

export const getChildren = (
  parentId: number,
  level: number,
  q?: string,
  signal?: AbortSignal,
): Promise<GeoItem[]> =>
  api.get<GeoItem[]>("/geo/children", {
    params: { parentId, level, ...(q ? { q } : {}) },
    signal,
  });

export const lookupPin = (pin: string, signal?: AbortSignal): Promise<PinDetails> =>
  api.get<PinDetails>(`/geo/pincode/${pin}`, { signal });

export const lookupPoint = (
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<GeoPointLookup[]> =>
  api.get<GeoPointLookup[]>("/geo/lookup", {
    params: { lat, lng },
    signal,
  });
