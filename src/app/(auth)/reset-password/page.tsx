import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/features/auth";

export const metadata: Metadata = { title: "Set New Password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const tokenString = typeof token === "string" ? token : "";

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader>
        <CardTitle className="text-xl">Set a new password</CardTitle>
        <CardDescription>
          Must be at least 8 characters long and different from previous passwords.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tokenString ? (
          <ResetPasswordForm token={tokenString} />
        ) : (
          <div className="py-4 text-center">
            <p className="text-destructive text-sm font-medium">Invalid or missing reset token.</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Please request a new password reset link.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
