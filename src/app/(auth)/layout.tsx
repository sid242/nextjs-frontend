import Link from "next/link";
import { ThemeToggle } from "@/components/molecules/theme-toggle";
import { siteConfig } from "@/config/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {siteConfig.name}
        </Link>
        <ThemeToggle />
      </header>
      <main id="main" className="grid flex-1 place-items-center p-4">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
