"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ControlledInput, FormInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import type { User } from "@/lib/api/types";

import { useUpdateProfile } from "../queries";
import { profileSchema, type ProfileValues } from "../schemas";

export function ProfileForm({ user }: { user?: Pick<User, "name" | "email"> }) {
  const router = useRouter();
  const methods = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
    mode: "onChange",
  });

  const updateProfileMutation = useUpdateProfile({
    onSuccess: (updated) => {
      methods?.reset({ name: updated?.name ?? "" });
      router?.refresh();
    },
  });

  return (
    <FormWrapper
      methods={methods}
      onSubmit={(values) => updateProfileMutation?.mutate(values)}
      className="grid max-w-md gap-4"
    >
      <ControlledInput
        name="name"
        label="Name"
        autoComplete="name"
        placeholder="Enter your name"
        required
      />
      <FormInput
        label="Email"
        value={user?.email ?? ""}
        readOnly
        disabled
        hint="Email can't be changed here."
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
