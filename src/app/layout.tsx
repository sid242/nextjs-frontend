import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { headers } from "next/headers";

import { AppProviders } from "@/components/providers/app-providers";
import { siteConfig } from "@/config/site";

import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading headers() opts the app into dynamic rendering, which the per-request CSP nonce requires.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body className="font-sans">
        <a
          href="#main"
          className="focus:bg-background sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:text-sm focus:shadow"
        >
          Skip to content
        </a>
        <AppProviders nonce={nonce}>{children}</AppProviders>
      </body>
    </html>
  );
}
