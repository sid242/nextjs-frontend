"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, KeyRound, Lock, Mail, Radio, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api/errors";

import { usePlatformLogin } from "../queries";

export function PlatformLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("superadmin@platform.local");
  const [password, setPassword] = useState("Platform@123456");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { mutateAsync: login, isPending } = usePlatformLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg("Email and password are required");
      return;
    }

    try {
      await login({ email: email.trim(), password });
      router.push("/platform/staff");
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, "Invalid platform credentials or account suspended"));
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-amber-600 text-white shadow-lg shadow-red-500/25">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <h1 className="text-xl font-bold tracking-tight">SaaS Platform Console</h1>
          <Badge variant="outline" className="border-red-500/40 font-mono text-[10px] text-red-500">
            SECURE
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs">
          Internal operator portal &bull; Zero-standing privileges to customer tenants
        </p>
      </div>

      <Card className="border-border/80 bg-card/60 shadow-xl backdrop-blur">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="h-4 w-4 text-red-500" />
            Operator Authentication
          </CardTitle>
          <CardDescription className="text-xs">
            Authenticate using your provisioned internal SaaS platform credentials.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="bg-destructive/10 text-destructive border-destructive/20 flex items-start gap-2 rounded-lg border p-3 text-xs">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Staff Email</Label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                <Input
                  type="email"
                  placeholder="operator@platform.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 pl-9 font-mono text-xs"
                  disabled={isPending}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Master Password</Label>
              <div className="relative">
                <KeyRound className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 pl-9 text-xs"
                  disabled={isPending}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="h-9 w-full gap-2 bg-gradient-to-r from-red-600 to-amber-600 text-xs text-white shadow-md shadow-red-600/20 hover:from-red-700 hover:to-amber-700"
            >
              {isPending ? "Verifying Credentials..." : "Authenticate Platform Session"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Seed Defaults Reminder */}
          <div className="bg-muted/40 border-border/60 text-muted-foreground mt-4 space-y-1 rounded-lg border p-3 font-mono text-[11px]">
            <div className="text-foreground flex items-center gap-1.5 font-semibold">
              <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
              Default Super Administrator:
            </div>
            <div className="text-muted-foreground text-[10px]">
              Email: <span className="text-foreground">superadmin@platform.local</span>
            </div>
            <div className="text-muted-foreground text-[10px]">
              Pass: <span className="text-foreground">Platform@123456</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
