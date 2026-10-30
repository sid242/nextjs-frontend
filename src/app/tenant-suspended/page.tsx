import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = { title: "Workspace Suspended" };

export default function TenantSuspendedPage() {
  return (
    <main id="main" className="grid min-h-screen place-items-center p-6 text-center">
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Workspace suspended</h1>
        <p className="text-muted-foreground">This workspace has been temporarily suspended.</p>
        <p className="text-muted-foreground text-sm">
          Please contact the workspace administrator or our support team for assistance.
        </p>
        <div>
          <Button asChild>
            <Link href="/">Go to main site</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
