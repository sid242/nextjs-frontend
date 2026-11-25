"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CameraIcon, Loader2Icon, MailIcon } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  ControlledInput,
  ControlledPhoneInput,
  ControlledSelect,
  FormInput,
  FormWrapper,
} from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/http";
import type { User } from "@/lib/api/types";
import { useTranslation, type SupportedLocale } from "@/lib/i18n";
import { resolveStorageUrl } from "@/lib/storage";

import { useUpdateProfile } from "../queries";
import { profileSchema, type ProfileValues } from "../schemas";
import { EmailChangeDialog } from "./email-change-dialog";

const TIMEZONE_OPTIONS = [
  { label: "UTC (Coordinated Universal Time)", value: "UTC" },
  { label: "Asia/Kolkata (IST, +05:30)", value: "Asia/Kolkata" },
  { label: "Asia/Dubai (GST, +04:00)", value: "Asia/Dubai" },
  { label: "Asia/Singapore (SGT, +08:00)", value: "Asia/Singapore" },
  { label: "America/New_York (EST/EDT)", value: "America/New_York" },
  { label: "America/Los_Angeles (PST/PDT)", value: "America/Los_Angeles" },
  { label: "America/Chicago (CST/CDT)", value: "America/Chicago" },
  { label: "Europe/London (GMT/BST)", value: "Europe/London" },
  { label: "Europe/Paris (CET/CEST)", value: "Europe/Paris" },
  { label: "Europe/Berlin (CET/CEST)", value: "Europe/Berlin" },
  { label: "Australia/Sydney (AEST/AEDT)", value: "Australia/Sydney" },
];

const LOCALE_OPTIONS = [
  { label: "English (US)", value: "en" },
  { label: "हिन्दी (Hindi)", value: "hi" },
];

const DATE_FORMAT_OPTIONS = [
  { label: "YYYY-MM-DD (2026-11-20)", value: "YYYY-MM-DD" },
  { label: "DD/MM/YYYY (20/11/2026)", value: "DD/MM/YYYY" },
  { label: "MM/DD/YYYY (11/20/2026)", value: "MM/DD/YYYY" },
];

export function ProfileForm({ user }: { user?: User }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [emailChangeOpen, setEmailChangeOpen] = useState(false);
  const { setLocale: setI18nLocale } = useTranslation();

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "U";

  const methods = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      avatarUrl: user?.avatarUrl ?? null,
      locale: user?.locale ?? "en",
      timezone: user?.timezone ?? "UTC",
      dateFormat: user?.dateFormat ?? "YYYY-MM-DD",
      phoneNumber: user?.phoneNumber ?? "",
    },
    mode: "onChange",
  });

  const updateProfileMutation = useUpdateProfile({
    onSuccess: (updated) => {
      methods?.reset({
        firstName: updated?.firstName ?? "",
        lastName: updated?.lastName ?? "",
        avatarUrl: updated?.avatarUrl ?? null,
        locale: updated?.locale ?? "en",
        timezone: updated?.timezone ?? "UTC",
        dateFormat: updated?.dateFormat ?? "YYYY-MM-DD",
        phoneNumber: updated?.phoneNumber ?? "",
      });
      if (updated?.locale) {
        setI18nLocale(updated.locale as SupportedLocale);
      }
      router?.refresh();
    },
  });

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPEG, PNG, WebP, or GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar size must not exceed 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // 1. Request presigned upload URL from backend
      const presignRes = await api.post<{
        upload: { url: string; fields: Record<string, string> };
        fileKey: string;
        publicUrl: string;
      }>("/users/me/avatar-upload-url", {
        contentType: file.type,
        filename: file.name,
      });

      // 2. Direct upload to S3 via FormData
      const formData = new FormData();
      Object.entries(presignRes.upload.fields).forEach(([k, v]) => formData.append(k, v));
      formData.append("file", file);

      const targetUploadUrl = resolveStorageUrl(presignRes.upload.url);
      const s3Res = await fetch(targetUploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!s3Res.ok && s3Res.status !== 204) {
        throw new Error("Failed to upload avatar to storage");
      }

      // 3. Update profile with new avatar URL
      const newAvatarUrl = presignRes.publicUrl;
      methods.setValue("avatarUrl", newAvatarUrl, { shouldDirty: true });
      await updateProfileMutation.mutateAsync({
        ...methods.getValues(),
        avatarUrl: newAvatarUrl,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const watchedAvatarUrl = useWatch({ control: methods.control, name: "avatarUrl" });
  const currentAvatarUrl = watchedAvatarUrl || user?.avatarUrl;

  return (
    <div className="space-y-6">
      {/* Avatar Header & Upload */}
      <div className="border-border/50 flex items-center gap-4 border-b pb-5">
        <div className="relative">
          <Avatar className="border-border/80 size-16 border shadow-xs">
            {currentAvatarUrl ? (
              <AvatarImage
                src={resolveStorageUrl(currentAvatarUrl)}
                alt={user?.firstName || "Avatar"}
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {isUploadingAvatar && (
            <div className="bg-background/70 absolute inset-0 flex items-center justify-center rounded-full backdrop-blur-xs">
              <Loader2Icon className="text-primary size-5 animate-spin" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileChange}
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5"
            >
              <CameraIcon className="size-3.5" />
              <span>Change Photo</span>
            </Button>
            {currentAvatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive text-xs"
                onClick={() => {
                  methods.setValue("avatarUrl", null, { shouldDirty: true });
                }}
              >
                Remove
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            JPG, PNG, WebP or GIF. Maximum file size 5MB.
          </p>
        </div>
      </div>

      <FormWrapper
        methods={methods}
        onSubmit={(values) => updateProfileMutation?.mutate(values)}
        className="grid w-full max-w-lg min-w-0 gap-4"
      >
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
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
            required
          />
        </div>

        {/* Email with Change Email modal trigger */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-foreground text-xs font-medium">Email Address</label>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="text-primary h-auto p-0 text-xs"
              onClick={() => setEmailChangeOpen(true)}
            >
              <MailIcon className="mr-1 size-3" />
              Change email
            </Button>
          </div>
          <FormInput
            value={user?.email ?? ""}
            readOnly
            disabled
            hint="Click 'Change email' above to request a verified email change."
          />
        </div>

        <ControlledPhoneInput
          name="phoneNumber"
          label="Phone Number"
          hint="Contact number with country dial code (default India +91)."
          defaultCountryCode="IN"
        />

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <ControlledSelect
            name="timezone"
            label="Timezone"
            options={TIMEZONE_OPTIONS}
            returnPrimitiveValue
            placeholder="Select timezone"
          />

          <ControlledSelect
            name="locale"
            label="Language"
            options={LOCALE_OPTIONS}
            returnPrimitiveValue
            placeholder="Select language"
          />
        </div>

        <ControlledSelect
          name="dateFormat"
          label="Date Format"
          options={DATE_FORMAT_OPTIONS}
          returnPrimitiveValue
          placeholder="Select date format"
        />

        <div className="pt-2">
          <SubmitButton
            pending={updateProfileMutation?.isPending}
            pendingText="Saving…"
            disabled={!methods?.formState?.isDirty}
          >
            Save changes
          </SubmitButton>
        </div>
      </FormWrapper>

      <EmailChangeDialog
        open={emailChangeOpen}
        onOpenChange={setEmailChangeOpen}
        currentEmail={user?.email}
        onSuccess={() => router?.refresh()}
      />
    </div>
  );
}
