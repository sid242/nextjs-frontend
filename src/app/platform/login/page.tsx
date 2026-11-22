import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ThemeToggle } from "@/components/molecules/theme-toggle";
import { AUTH_ROUTES } from "@/config/routes";
import { PlatformLoginForm } from "@/features/platform";

export const metadata = {
  title: "Platform Console Sign In",
  description: "Sign in with a platform staff account.",
};

export default async function PlatformLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <header className="border-border/80 border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
          <Link
            href={AUTH_ROUTES.LOGIN}
            className="text-muted-foreground hover:text-foreground inline-flex min-h-10 items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Customer sign-in
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="grid flex-1 place-items-center px-5 py-10 sm:px-8">
        <PlatformLoginForm next={typeof next === "string" ? next : undefined} />
      </main>
    </div>
  );
}
