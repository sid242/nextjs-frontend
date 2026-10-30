import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = { title: "Workspace Not Found" };

export default function TenantNotFoundPage() {
  return (
    <main id="main" className="grid min-h-screen place-items-center p-6 text-center">
      <div className="grid gap-4">
        <p className="text-muted-foreground text-sm font-medium">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">Workspace not found</h1>
        <p className="text-muted-foreground">
          This workspace doesn&apos;t exist or has been removed.
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
