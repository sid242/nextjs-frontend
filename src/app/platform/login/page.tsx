import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PlatformLoginForm } from "@/features/platform";

export const metadata = {
  title: "Platform Console Login | SaaS Operator Access",
  description: "Secure authentication surface for internal SaaS platform operators.",
};

export default function PlatformLoginPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col justify-between p-4 sm:p-8">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Switch to Customer Tenant Login
        </Link>
      </div>

      <div className="py-12">
        <PlatformLoginForm />
      </div>

      <div className="text-muted-foreground/60 mx-auto max-w-sm text-center font-mono text-xs">
        Restricted to verified internal personnel. All login attempts and IP addresses are recorded
        to the platform security audit trail.
      </div>
    </div>
  );
}
