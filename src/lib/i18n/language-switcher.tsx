"use client";

import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useTranslation } from "./context";
import type { SupportedLocale } from "./types";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "icon" | "full" | "outline";
}

export function LanguageSwitcher({ className, variant = "icon" }: LanguageSwitcherProps) {
  const router = useRouter();
  const { locale, setLocale, locales, currentLocaleInfo } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            className={cn("text-muted-foreground hover:text-foreground h-9 w-9", className)}
            aria-label="Change language"
            title={`Language: ${currentLocaleInfo.nativeName}`}
          >
            <Globe className="size-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={cn("h-8 gap-2 text-xs font-normal", className)}
            aria-label="Change language"
          >
            <span className="text-sm">{currentLocaleInfo.flag}</span>
            <span>{currentLocaleInfo.nativeName}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="text-muted-foreground border-border/40 mb-1 border-b px-2 py-1.5 text-xs font-semibold">
          Select Language
        </div>
        {locales.map((loc) => {
          const isSelected = loc.code === locale;
          return (
            <DropdownMenuItem
              key={loc.code}
              onSelect={() => {
                setLocale(loc.code as SupportedLocale, true);
                router.refresh();
              }}
              className="flex cursor-pointer items-center justify-between py-1.5 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none">{loc.flag}</span>
                <span className="font-medium">{loc.nativeName}</span>
                {loc.name !== loc.nativeName && (
                  <span className="text-muted-foreground text-[10px]">({loc.name})</span>
                )}
              </div>
              {isSelected && <Check className="text-primary size-3.5" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
