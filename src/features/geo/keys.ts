const all = ["geo"] as const;

export const geoKeys = {
  all,
  states: () => [...all, "states"] as const,
  children: (parentId?: number | null, level?: number | null, q?: string) =>
    [...all, "children", parentId, level, q ?? ""] as const,
  pin: (pin: string) => [...all, "pin", pin] as const,
  point: (lat: number, lng: number) => [...all, "point", lat, lng] as const,
};
