"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { ControlledInput } from "@/components/molecules/forms";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VirtualizedSelect, type SelectOption } from "@/components/ui/virtualized-select";

import * as geoApi from "../api";
import { useGeoChildren, useGeoPin, useGeoStates } from "../queries";

export function GeoAddressFields({ disabled }: { disabled?: boolean }) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const countryCode = watch("countryCode") ?? "IN";
  const stateGeoId = watch("stateGeoId");
  const districtGeoId = watch("districtGeoId");
  const subdistrictGeoId = watch("subdistrictGeoId");
  const localityKind = watch("localityKind") ?? "CITY";
  const localityGeoId = watch("localityGeoId");
  const postalCode = watch("postalCode");

  const [isLocating, setIsLocating] = useState(false);

  // Reference queries
  const { data: states, isLoading: isLoadingStates } = useGeoStates();

  const { data: districts, isLoading: isLoadingDistricts } = useGeoChildren(
    stateGeoId,
    3,
    undefined,
    { enabled: Boolean(stateGeoId && countryCode === "IN") },
  );

  const { data: subdistricts, isLoading: isLoadingSubdistricts } = useGeoChildren(
    districtGeoId,
    4,
    undefined,
    { enabled: Boolean(districtGeoId && countryCode === "IN") },
  );

  const { data: cities, isLoading: isLoadingCities } = useGeoChildren(districtGeoId, 5, undefined, {
    enabled: Boolean(districtGeoId && localityKind === "CITY" && countryCode === "IN"),
  });

  const { data: villages, isLoading: isLoadingVillages } = useGeoChildren(
    subdistrictGeoId,
    6,
    undefined,
    { enabled: Boolean(subdistrictGeoId && localityKind === "VILLAGE" && countryCode === "IN") },
  );

  const isValidPin = countryCode === "IN" && Boolean(postalCode && /^[1-9]\d{5}$/.test(postalCode));
  const { data: pinData, isLoading: isPinLoading } = useGeoPin(postalCode, {
    enabled: isValidPin,
  });

  // Auto-populate administrative hierarchy when PIN is resolved
  useEffect(() => {
    if (!pinData) return;
    if (pinData?.state?.id) {
      setValue("stateGeoId", pinData.state.id, { shouldValidate: true });
      setValue("stateName", pinData.state.name);
    }
    if (pinData?.district?.id) {
      setValue("districtGeoId", pinData.district.id, { shouldValidate: true });
      setValue("districtName", pinData.district.name);
    }
    if (pinData?.subdistrict?.id) {
      setValue("subdistrictGeoId", pinData.subdistrict.id, { shouldValidate: true });
      setValue("subdistrictName", pinData.subdistrict.name);
    }
    if (pinData?.area?.name) {
      setValue("areaName", pinData.area.name);
      setValue("areaGeoId", pinData.area.id);
    }
  }, [pinData, setValue]);

  // GPS geolocation handler
  const handleUseMyLocation = () => {
    if (!navigator?.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos?.coords?.latitude;
          const lng = pos?.coords?.longitude;
          if (lat !== undefined && lng !== undefined) {
            setValue("latitude", lat);
            setValue("longitude", lng);

            const results = await geoApi.lookupPoint(lat, lng);
            const stateHit = results?.find((r) => r?.level === "state" || r?.level === "STATE");
            const districtHit = results?.find(
              (r) => r?.level === "district" || r?.level === "DISTRICT",
            );
            const pinHit = results?.find(
              (r) => r?.level === "pincode" || r?.level === "PINCODE" || r?.level === "area",
            );

            if (stateHit?.id) {
              setValue("stateGeoId", stateHit.id, { shouldValidate: true });
              setValue("stateName", stateHit.name);
            }
            if (districtHit?.id) {
              setValue("districtGeoId", districtHit.id, { shouldValidate: true });
              setValue("districtName", districtHit.name);
            }
            if (pinHit?.name && /^[1-9]\d{5}$/.test(pinHit.name)) {
              setValue("postalCode", pinHit.name, { shouldValidate: true });
            }
          }
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const stateOptions: SelectOption<number>[] =
    states?.map((s) => ({ label: s.name, value: s.id })) ?? [];

  const districtOptions: SelectOption<number>[] =
    districts?.map((d) => ({ label: d.name, value: d.id })) ?? [];

  const subdistrictOptions: SelectOption<number>[] =
    subdistricts?.map((sd) => ({ label: sd.name, value: sd.id })) ?? [];

  const localityOptions: SelectOption<number>[] =
    localityKind === "CITY"
      ? (cities?.map((c) => ({ label: c.name, value: c.id })) ?? [])
      : (villages?.map((v) => ({ label: v.name, value: v.id })) ?? []);

  return (
    <div className="grid gap-4">
      {/* Country & GPS Action */}
      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="countryCode">Country</Label>
          <Select
            value={countryCode}
            onValueChange={(val) => {
              setValue("countryCode", val, { shouldValidate: true });
              setValue("stateGeoId", undefined);
              setValue("districtGeoId", undefined);
              setValue("subdistrictGeoId", undefined);
              setValue("localityGeoId", undefined);
              setValue("areaGeoId", undefined);
            }}
            disabled={disabled}
          >
            <SelectTrigger id="countryCode">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IN">India (IN)</SelectItem>
              <SelectItem value="US">United States (US)</SelectItem>
              <SelectItem value="GB">United Kingdom (GB)</SelectItem>
              <SelectItem value="AE">United Arab Emirates (AE)</SelectItem>
              <SelectItem value="SG">Singapore (SG)</SelectItem>
              <SelectItem value="OTHER">Other Country</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleUseMyLocation}
            disabled={disabled || isLocating}
          >
            {isLocating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="mr-2 h-4 w-4" />
            )}
            Use My Location
          </Button>
        </div>
      </div>

      {/* Postal / PIN code */}
      <div className="relative">
        <ControlledInput
          name="postalCode"
          label={countryCode === "IN" ? "PIN Code (6 digits)" : "Postal / ZIP Code"}
          placeholder={countryCode === "IN" ? "e.g. 380006" : "Postal Code"}
          disabled={disabled}
          maxLength={12}
        />
        {isPinLoading && (
          <div className="absolute top-9 right-3">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          </div>
        )}
      </div>

      {countryCode === "IN" ? (
        <>
          {/* State & District Dropdowns */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>State</Label>
              <VirtualizedSelect<number>
                options={stateOptions}
                value={stateGeoId}
                loading={isLoadingStates}
                placeholder="Select State"
                searchPlaceholder="Search states..."
                disabled={disabled}
                onValueChange={(opt) => {
                  const selected = Array.isArray(opt) ? opt[0] : opt;
                  setValue("stateGeoId", selected?.value ?? undefined, { shouldValidate: true });
                  setValue("stateName", selected?.label ?? undefined);
                  setValue("districtGeoId", undefined);
                  setValue("districtName", undefined);
                  setValue("subdistrictGeoId", undefined);
                  setValue("subdistrictName", undefined);
                  setValue("localityGeoId", undefined);
                  setValue("localityName", undefined);
                }}
              />
              {errors?.stateGeoId && (
                <p className="text-destructive text-xs">{errors.stateGeoId.message as string}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>District</Label>
              <VirtualizedSelect<number>
                options={districtOptions}
                value={districtGeoId}
                loading={isLoadingDistricts}
                placeholder={stateGeoId ? "Select District" : "Select State first"}
                searchPlaceholder="Search districts..."
                disabled={disabled || !stateGeoId}
                onValueChange={(opt) => {
                  const selected = Array.isArray(opt) ? opt[0] : opt;
                  setValue("districtGeoId", selected?.value ?? undefined, { shouldValidate: true });
                  setValue("districtName", selected?.label ?? undefined);
                  setValue("subdistrictGeoId", undefined);
                  setValue("subdistrictName", undefined);
                  setValue("localityGeoId", undefined);
                  setValue("localityName", undefined);
                }}
              />
            </div>
          </div>

          {/* Sub-district & Locality Selection */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Sub-district (Taluka / Tehsil)</Label>
              <VirtualizedSelect<number>
                options={subdistrictOptions}
                value={subdistrictGeoId}
                loading={isLoadingSubdistricts}
                placeholder={districtGeoId ? "Select Sub-district" : "Select District first"}
                searchPlaceholder="Search sub-districts..."
                disabled={disabled || !districtGeoId}
                onValueChange={(opt) => {
                  const selected = Array.isArray(opt) ? opt[0] : opt;
                  setValue("subdistrictGeoId", selected?.value ?? undefined, {
                    shouldValidate: true,
                  });
                  setValue("subdistrictName", selected?.label ?? undefined);
                  if (localityKind === "VILLAGE") {
                    setValue("localityGeoId", undefined);
                    setValue("localityName", undefined);
                  }
                }}
              />
            </div>

            <div>
              <Label>Locality Type</Label>
              <Select
                value={localityKind}
                onValueChange={(val: "CITY" | "VILLAGE") => {
                  setValue("localityKind", val, { shouldValidate: true });
                  setValue("localityGeoId", undefined);
                  setValue("localityName", undefined);
                }}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CITY">City / Town</SelectItem>
                  <SelectItem value="VILLAGE">Village</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{localityKind === "CITY" ? "City" : "Village"}</Label>
              <VirtualizedSelect<number>
                options={localityOptions}
                value={localityGeoId}
                loading={localityKind === "CITY" ? isLoadingCities : isLoadingVillages}
                placeholder={
                  localityKind === "CITY"
                    ? districtGeoId
                      ? "Select City"
                      : "Select District first"
                    : subdistrictGeoId
                      ? "Select Village"
                      : "Select Sub-district first"
                }
                searchPlaceholder={`Search ${localityKind.toLowerCase()}s...`}
                disabled={
                  disabled ||
                  (localityKind === "CITY" && !districtGeoId) ||
                  (localityKind === "VILLAGE" && !subdistrictGeoId)
                }
                onValueChange={(opt) => {
                  const selected = Array.isArray(opt) ? opt[0] : opt;
                  setValue("localityGeoId", selected?.value ?? undefined, { shouldValidate: true });
                  setValue("localityName", selected?.label ?? undefined);
                }}
              />
            </div>
          </div>
        </>
      ) : (
        /* Non-India free-text fields */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ControlledInput
            name="stateName"
            label="State / Province / Region"
            placeholder="e.g. California"
            disabled={disabled}
          />
          <ControlledInput
            name="localityName"
            label="City / Town"
            placeholder="e.g. San Francisco"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
