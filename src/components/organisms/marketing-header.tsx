import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/molecules/theme-toggle";
import { siteConfig } from "@/config/site";

export function MarketingHeader() {
  return (
    <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        {siteConfig.name}
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button asChild variant="ghost">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild>
          <Link href="/register">Get started</Link>
        </Button>
      </div>
    </header>
  );
}
