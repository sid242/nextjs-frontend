export interface GeoItem {
  id: number;
  name: string;
  code?: string | null;
  levelId?: number;
}

export interface PinDetails {
  pin: string;
  area: GeoItem;
  state: GeoItem | null;
  district: GeoItem | null;
  subdistrict: GeoItem | null;
  chain: GeoItem[];
}

export interface GeoPointLookup {
  level: string;
  id: number | null;
  name: string;
  code?: string | null;
}
