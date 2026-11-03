"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";

import {
  ControlledCheckbox,
  ControlledInput,
  ControlledPhoneInput,
  FormWrapper,
} from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GeoAddressFields } from "@/features/geo";

import {
  ADDRESS_TYPES,
  addressSchema,
  type Address,
  type AddressInput,
  type AddressType,
} from "../schemas";

export interface AddressFormProps {
  initialData?: Address | null;
  onSubmit: (values: AddressInput) => void | Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function AddressForm({ initialData, onSubmit, isLoading, onCancel }: AddressFormProps) {
  const methods = useForm<AddressInput>({
    resolver: zodResolver(addressSchema) as unknown as Resolver<AddressInput>,
    defaultValues: {
      type: initialData?.type ?? "OTHER",
      label: initialData?.label ?? "",
      recipientName: initialData?.recipientName ?? "",
      phone: initialData?.phone ?? "",
      line1: initialData?.line1 ?? "",
      line2: initialData?.line2 ?? "",
      landmark: initialData?.landmark ?? "",
      countryCode: initialData?.countryCode ?? "IN",
      postalCode: initialData?.postalCode ?? "",
      stateGeoId: initialData?.stateGeoId ?? undefined,
      districtGeoId: initialData?.districtGeoId ?? undefined,
      subdistrictGeoId: initialData?.subdistrictGeoId ?? undefined,
      localityKind: initialData?.localityKind ?? "CITY",
      localityGeoId: initialData?.localityGeoId ?? undefined,
      areaGeoId: initialData?.areaGeoId ?? undefined,
      stateName: initialData?.stateName ?? "",
      districtName: initialData?.districtName ?? "",
      subdistrictName: initialData?.subdistrictName ?? "",
      localityName: initialData?.localityName ?? "",
      areaName: initialData?.areaName ?? "",
      latitude: initialData?.latitude ? Number(initialData.latitude) : undefined,
      longitude: initialData?.longitude ? Number(initialData.longitude) : undefined,
      isDefault: initialData?.isDefault ?? false,
    },
    mode: "onChange",
  });

  const selectedType = methods.watch("type");

  return (
    <FormWrapper methods={methods} onSubmit={onSubmit} className="grid gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="address-type">Address Type</Label>
          <Select
            value={selectedType}
            onValueChange={(val: AddressType) =>
              methods.setValue("type", val, { shouldValidate: true })
            }
            disabled={isLoading}
          >
            <SelectTrigger id="address-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ADDRESS_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ControlledInput
          name="label"
          label="Label (Optional)"
          placeholder="e.g. Headquarters, Home, Factory"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ControlledInput
          name="recipientName"
          label="Recipient Name (Optional)"
          placeholder="e.g. Siddharth Prajapati"
          disabled={isLoading}
        />
        <ControlledPhoneInput
          name="phone"
          label="Phone Number (Optional)"
          defaultCountryCode={initialData?.countryCode ?? "IN"}
          disabled={isLoading}
        />
      </div>

      <ControlledInput
        name="line1"
        label="Address Line 1"
        placeholder="Street address, building, suite"
        required
        disabled={isLoading}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ControlledInput
          name="line2"
          label="Address Line 2 (Optional)"
          placeholder="Floor, apartment, unit"
          disabled={isLoading}
        />
        <ControlledInput
          name="landmark"
          label="Landmark (Optional)"
          placeholder="e.g. Opposite Metro Station"
          disabled={isLoading}
        />
      </div>

      {/* Geospatial & Administrative fields */}
      <GeoAddressFields disabled={isLoading} />

      <div className="pt-2">
        <ControlledCheckbox
          name="isDefault"
          label="Set as default address for this type"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t pt-3">
        {onCancel && (
          <button
            type="button"
            className="hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
        <SubmitButton pending={isLoading} pendingText={initialData ? "Updating..." : "Saving..."}>
          {initialData ? "Update Address" : "Save Address"}
        </SubmitButton>
      </div>
    </FormWrapper>
  );
}
