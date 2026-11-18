"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  ControlledInput,
  ControlledPhoneInput,
  FormInput,
  FormWrapper,
} from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import type { User } from "@/lib/api/types";

import { useUpdateProfile } from "../queries";
import { profileSchema, type ProfileValues } from "../schemas";

export function ProfileForm({
  user,
}: {
  user?: Pick<User, "name" | "firstName" | "lastName" | "email" | "phoneNumber">;
}) {
  const router = useRouter();

  const userFirst = user?.firstName ?? (user?.name ? user.name.split(" ")[0] : "");
  const userLast = user?.lastName ?? (user?.name ? user.name.split(" ").slice(1).join(" ") : "");

  const methods = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: userFirst ?? "",
      lastName: userLast ?? "",
      name: user?.name ?? "",
      phoneNumber: user?.phoneNumber ?? "",
    },
    mode: "onChange",
  });

  const updateProfileMutation = useUpdateProfile({
    onSuccess: (updated) => {
      methods?.reset({
        firstName: updated?.firstName ?? "",
        lastName: updated?.lastName ?? "",
        name: updated?.name ?? "",
        phoneNumber: updated?.phoneNumber ?? "",
      });
      router?.refresh();
    },
  });

  return (
    <FormWrapper
      methods={methods}
      onSubmit={(values) => updateProfileMutation?.mutate(values)}
      className="grid max-w-md gap-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <ControlledInput
          name="firstName"
          label="First Name"
          autoComplete="given-name"
          placeholder="First name"
          required
        />
        <ControlledInput
          name="lastName"
          label="Last Name"
          autoComplete="family-name"
          placeholder="Last name"
        />
      </div>
      <FormInput
        label="Email"
        value={user?.email ?? ""}
        readOnly
        disabled
        hint="Email can't be changed here."
      />
      <ControlledPhoneInput
        name="phoneNumber"
        label="Phone Number"
        hint="Contact number with country dial code (default India +91)."
        defaultCountryCode="IN"
      />
      <div>
        <SubmitButton
          pending={updateProfileMutation?.isPending}
          pendingText="Saving…"
          disabled={!methods?.formState?.isDirty}
        >
          Save changes
        </SubmitButton>
      </div>
    </FormWrapper>
  );
}
