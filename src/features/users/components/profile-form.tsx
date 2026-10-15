"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { FormField } from "@/components/molecules/form-field";
import { SubmitButton } from "@/components/molecules/submit-button";
import type { User } from "@/lib/api/types";
import { updateMe } from "../api";
import { profileSchema, type ProfileValues } from "../schemas";

export function ProfileForm({ user }: { user: Pick<User, "name" | "email"> }) {
  const router = useRouter();
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name },
  });

  const mutation = useMutation({
    mutationFn: updateMe,
    meta: { errorMessage: "Could not update your profile." }, // custom text for the global error toast
    onSuccess: (updated) => {
      toast.success("Profile updated");
      form.reset({ name: updated.name });
      router.refresh(); // re-render server components that show the name
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="grid max-w-md gap-4"
      noValidate
    >
      <FormField
        label="Name"
        autoComplete="name"
        error={form.formState.errors.name?.message}
        {...form.register("name")}
      />
      <FormField
        label="Email"
        value={user.email}
        readOnly
        disabled
        hint="Email can't be changed here."
      />
      <div>
        <SubmitButton
          pending={mutation.isPending}
          pendingText="Saving…"
          disabled={!form.formState.isDirty}
        >
          Save changes
        </SubmitButton>
      </div>
    </form>
  );
}
