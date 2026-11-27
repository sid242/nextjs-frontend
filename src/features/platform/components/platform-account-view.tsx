"use client";

import { useRef, useState, type ComponentType, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BellRing,
  Camera,
  CheckCircle2,
  CopyIcon,
  KeyRound,
  Loader2,
  Lock,
  LucideIcon,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCog,
} from "lucide-react";
import QRCode from "qrcode";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { PageHeader } from "@/components/molecules/page-header";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PushSettingsCard } from "@/features/notifications";
import { getErrorMessage } from "@/lib/api/errors";
import { api } from "@/lib/api/http";
import { usePersistedTab } from "@/lib/hooks";
import { resolveStorageUrl } from "@/lib/storage";

import {
  useChangePlatformPassword,
  useDisablePlatformTwoFactor,
  useEnablePlatformTwoFactor,
  usePlatformMe,
  usePlatformTwoFactorStatus,
  useSetupPlatformTwoFactor,
  useUpdatePlatformProfile,
} from "../queries";
import {
  changePlatformPasswordSchema,
  updatePlatformProfileSchema,
  type ChangePlatformPasswordInput,
  type UpdatePlatformProfileInput,
} from "../schemas";

interface AccountTabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
}

const ACCOUNT_TABS: AccountTabConfig[] = [
  { id: "profile", label: "Profile & Identity", icon: UserCog, component: ProfileSection },
  { id: "security", label: "Password & Security", icon: Lock, component: PasswordSection },
  { id: "2fa", label: "Two-Factor Authentication", icon: KeyRound, component: TwoFactorSection },
  {
    id: "notifications",
    label: "Notifications & Push",
    icon: BellRing,
    component: NotificationsSection,
  },
];

const ACCOUNT_TAB_IDS = ACCOUNT_TABS.map((t) => t.id);

export function PlatformAccountView() {
  const [activeTab, setActiveTab] = usePersistedTab({
    paramName: "tab",
    defaultTab: "profile",
    allowedTabs: ACCOUNT_TAB_IDS,
    storageKey: "platform_account_active_tab",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account & Security"
        description="Manage your operator identity, password authentication, two-factor verification, and push alert preferences."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="w-full overflow-x-auto pb-1">
          <TabsList className="bg-muted/60 inline-flex h-auto w-max flex-nowrap items-center justify-start gap-1 p-1">
            {ACCOUNT_TABS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="data-[state=active]:bg-background shrink-0 gap-1.5 whitespace-nowrap"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {ACCOUNT_TABS.map(({ id, component: Component }) => (
          <TabsContent key={id} value={id}>
            <Component />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function NotificationsSection() {
  return <PushSettingsCard scope="platform" />;
}

function ProfileSection() {
  const { data: staff, isLoading } = usePlatformMe();
  const updateMutation = useUpdatePlatformProfile();
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const methods = useForm<UpdatePlatformProfileInput>({
    resolver: zodResolver(updatePlatformProfileSchema),
    values: {
      displayName: staff?.displayName ?? "",
      avatarUrl: staff?.avatarUrl ?? "",
      department: staff?.department ?? "",
      jobTitle: staff?.jobTitle ?? "",
    },
  });

  const avatarUrl = useWatch({ control: methods.control, name: "avatarUrl" });
  const displayName = useWatch({ control: methods.control, name: "displayName" });

  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "OP";

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar image size must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // 1. Request presigned upload URL from platform backend
      const presignRes = await api.post<{
        upload: { url: string; fields: Record<string, string> };
        fileKey: string;
        publicUrl: string;
      }>("/platform/auth/me/avatar-upload-url", {
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
      await updateMutation.mutateAsync({
        ...methods.getValues(),
        avatarUrl: newAvatarUrl,
      });
      toast.success("Profile photo updated successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      methods.setValue("avatarUrl", "", { shouldDirty: true });
      await updateMutation.mutateAsync({
        ...methods.getValues(),
        avatarUrl: "",
      });
      toast.success("Profile photo removed");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const onSubmit = async (values: UpdatePlatformProfileInput) => {
    setFormError(null);
    try {
      await updateMutation.mutateAsync(values);
      toast.success("Platform profile updated successfully");
    } catch (err) {
      const msg = getErrorMessage(err);
      setFormError(msg);
      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-muted-foreground p-8 text-center text-sm">
          Loading profile details...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operator Profile</CardTitle>
        <CardDescription>
          Your public name and identity across platform audit logs, support sessions, and operator
          rosters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {formError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {/* Identity Badge Header & Interactive Photo Uploader */}
        <div className="bg-muted/40 mb-6 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-indigo-500/30 shadow-xs">
              {avatarUrl ? (
                <AvatarImage
                  src={resolveStorageUrl(avatarUrl)}
                  alt={displayName || "Staff"}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-indigo-600/10 text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isUploadingAvatar && (
              <div className="bg-background/70 absolute inset-0 flex items-center justify-center rounded-full backdrop-blur-xs">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">{staff?.displayName || "Operator"}</h3>
              <Badge
                variant="outline"
                className="border-indigo-500/30 bg-indigo-500/10 text-indigo-600"
              >
                {staff?.roleName || staff?.roleKey || "Platform Staff"}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-xs">{staff?.email}</p>

            <div className="flex items-center gap-2 pt-1">
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
                className="h-8 gap-1.5 text-xs"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Change Photo</span>
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isUploadingAvatar}
                  onClick={handleRemoveAvatar}
                  className="text-muted-foreground hover:text-destructive h-8 gap-1.5 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        <FormWrapper methods={methods} onSubmit={onSubmit} className="max-w-2xl space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ControlledInput
              name="displayName"
              label="Display Name"
              placeholder="e.g. Jane Doe"
              description="Your name as displayed across internal console tools."
            />
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                value={staff?.email || ""}
                disabled
                className="bg-muted/50 cursor-not-allowed font-mono text-xs"
              />
              <p className="text-muted-foreground text-[11px]">
                Email is managed centrally by root administrators.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ControlledInput
              name="department"
              label="Department"
              placeholder="e.g. Infrastructure & Security"
            />
            <ControlledInput
              name="jobTitle"
              label="Job Title"
              placeholder="e.g. Senior Platform SRE"
            />
          </div>

          <div className="flex justify-end pt-2">
            <SubmitButton pending={updateMutation.isPending}>Save Changes</SubmitButton>
          </div>
        </FormWrapper>
      </CardContent>
    </Card>
  );
}

function PasswordSection() {
  const changePasswordMutation = useChangePlatformPassword();
  const [formError, setFormError] = useState<string | null>(null);

  const methods = useForm<ChangePlatformPasswordInput>({
    resolver: zodResolver(changePlatformPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ChangePlatformPasswordInput) => {
    setFormError(null);
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      methods.reset();
      toast.success("Password changed successfully! Keep your credentials safe.");
    } catch (err) {
      const msg = getErrorMessage(err);
      setFormError(msg);
      toast.error(msg);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your platform console login password. Minimum 8 characters required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {formError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <FormWrapper methods={methods} onSubmit={onSubmit} className="max-w-md space-y-4">
          <ControlledInput
            name="currentPassword"
            label="Current Password"
            type="password"
            placeholder="Enter current password"
          />

          <ControlledInput
            name="newPassword"
            label="New Password"
            type="password"
            placeholder="At least 8 characters"
          />

          <ControlledInput
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password"
          />

          <div className="flex justify-end pt-2">
            <SubmitButton pending={changePasswordMutation.isPending}>Update Password</SubmitButton>
          </div>
        </FormWrapper>
      </CardContent>
    </Card>
  );
}

function TwoFactorSection() {
  const { data: status, isLoading: statusLoading } = usePlatformTwoFactorStatus();
  const setupMutation = useSetupPlatformTwoFactor();
  const enableMutation = useEnablePlatformTwoFactor();
  const disableMutation = useDisablePlatformTwoFactor();

  const [setupStep, setSetupStep] = useState<"idle" | "qr" | "recovery">("idle");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState<string>("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [showDisableForm, setShowDisableForm] = useState(false);

  const startSetup = async () => {
    try {
      const res = await setupMutation.mutateAsync();
      setSecretKey(res.secret);
      if (res.otpauthUri) {
        const generated = await QRCode.toDataURL(res.otpauthUri, {
          margin: 2,
          width: 220,
          color: { dark: "#000000", light: "#ffffff" },
        });
        setQrCodeUrl(generated);
      }
      setSetupStep("qr");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleVerifyEnable = async (e: FormEvent) => {
    e.preventDefault();
    if (!verifyCode || verifyCode.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }
    try {
      const res = await enableMutation.mutateAsync({ code: verifyCode.trim() });
      if (res.recoveryCodes && res.recoveryCodes.length > 0) {
        setRecoveryCodes(res.recoveryCodes);
        setSetupStep("recovery");
      } else {
        setSetupStep("idle");
      }
      toast.success("Two-Factor Authentication enabled successfully!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDisable = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await disableMutation.mutateAsync({
        password: disablePassword,
        code: disableCode,
      });
      setShowDisableForm(false);
      setDisablePassword("");
      setDisableCode("");
      toast.success("Two-Factor Authentication has been disabled");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const isEnabled = status?.enabled === true;

  if (statusLoading) {
    return (
      <Card>
        <CardContent className="text-muted-foreground p-8 text-center text-sm">
          Checking 2FA configuration status...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Authenticator App (TOTP)</CardTitle>
            <CardDescription>
              Protect your platform account with two-factor verification using Google Authenticator,
              1Password, or Authy.
            </CardDescription>
          </div>
          <div>
            {isEnabled ? (
              <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                2FA Enabled
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500/30 text-amber-600">
                <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
                Not Configured
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isEnabled && setupStep === "idle" && (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Two-factor authentication adds an extra layer of security. Whenever you sign in to
                the platform console, you will need to provide a 6-digit token from your
                authenticator device.
              </p>
              <Button onClick={startSetup} disabled={setupMutation.isPending} className="gap-2">
                <KeyRound className="h-4 w-4" />
                Set Up Authenticator App
              </Button>
            </div>
          )}

          {!isEnabled && setupStep === "qr" && (
            <div className="max-w-xl space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">1. Scan QR Code</h4>
                <p className="text-muted-foreground text-xs">
                  Open your authenticator app and scan this barcode or copy the manual setup key
                  below.
                </p>
                {qrCodeUrl && (
                  <div className="inline-block rounded-xl border bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCodeUrl} alt="2FA QR Code" className="h-44 w-44" />
                  </div>
                )}
                {secretKey && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Manual Secret Key:</Label>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted rounded px-2 py-1 font-mono text-xs">
                        {secretKey}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => {
                          navigator.clipboard.writeText(secretKey);
                          toast.success("Secret copied to clipboard!");
                        }}
                      >
                        <CopyIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleVerifyEnable} className="space-y-3">
                <h4 className="text-sm font-semibold">2. Enter 6-Digit Verification Code</h4>
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="000000"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-40 text-center font-mono text-lg tracking-widest"
                    maxLength={6}
                  />
                  <Button
                    type="submit"
                    disabled={enableMutation.isPending || verifyCode.length !== 6}
                  >
                    Verify &amp; Activate
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setSetupStep("idle")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {!isEnabled && setupStep === "recovery" && (
            <div className="max-w-xl space-y-4">
              <Alert className="border-emerald-500/20 bg-emerald-500/5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700 dark:text-emerald-400">
                  Two-factor authentication is now active! Please download or safely store these
                  one-time recovery codes.
                </AlertDescription>
              </Alert>
              <div className="bg-muted/40 grid grid-cols-2 gap-2 rounded-lg border p-4 font-mono text-xs">
                {recoveryCodes.map((code, i) => (
                  <span key={i} className="text-muted-foreground">
                    {code}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(recoveryCodes.join("\n"));
                    toast.success("Recovery codes copied to clipboard!");
                  }}
                  className="gap-1.5 text-xs"
                >
                  <CopyIcon className="h-3.5 w-3.5" />
                  Copy Codes
                </Button>
                <Button size="sm" onClick={() => setSetupStep("idle")}>
                  Done
                </Button>
              </div>
            </div>
          )}

          {isEnabled && (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Two-factor authentication is active on your account. Your login is protected by TOTP
                verification tokens.
              </p>

              {!showDisableForm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowDisableForm(true)}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  Disable Two-Factor Authentication
                </Button>
              ) : (
                <form
                  onSubmit={handleDisable}
                  className="border-destructive/20 bg-destructive/5 max-w-sm space-y-3 rounded-lg border p-4"
                >
                  <h4 className="text-destructive text-sm font-semibold">Disable 2FA</h4>
                  <p className="text-muted-foreground text-xs">
                    Please confirm your current password and a 6-digit TOTP code to disable
                    two-factor protection.
                  </p>
                  <Input
                    type="password"
                    placeholder="Current Password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="6-digit code"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value)}
                    required
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={disableMutation.isPending || !disablePassword || !disableCode}
                    >
                      Confirm Disable
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowDisableForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
