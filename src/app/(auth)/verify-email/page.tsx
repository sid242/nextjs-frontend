import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { VerifyEmailView } from "@/features/auth";

export const metadata: Metadata = { title: "Verify Email" };

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;
  const tokenString = typeof token === "string" ? token : undefined;

  return (
    <Card className="border-border/60 shadow-xs">
      <CardContent className="pt-6">
        <VerifyEmailView token={tokenString} />
      </CardContent>
    </Card>
  );
}
