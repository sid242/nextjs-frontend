"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ControlledInput, FormInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import type { User } from "@/lib/api/types";
import { updateMe } from "../api";
import { profileSchema, type ProfileValues } from "../schemas";

export function ProfileForm({ user }: { user: Pick<User, "name" | "email"> }) {
  const router = useRouter();
  const methods = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: updateMe,
    meta: { errorMessage: "Could not update your profile." },
    onSuccess: (updated) => {
      toast.success("Profile updated");
      methods?.reset({ name: updated?.name ?? "" });
      router?.refresh();
    },
  });

  return (
    <FormWrapper
      methods={methods}
      onSubmit={(values) => mutation?.mutate(values)}
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
        value={user?.email}
        readOnly
        disabled
        hint="Email can't be changed here."
      />
      <div>
        <SubmitButton
          pending={mutation?.isPending}
          pendingText="Saving…"
          disabled={!methods?.formState?.isDirty}
        >
          Save changes
        </SubmitButton>
      </div>
    </FormWrapper>
  );
}
