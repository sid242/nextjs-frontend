"use client";

import { useState } from "react";
import { BookOpenIcon, HistoryIcon, SparklesIcon, TagIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatDate } from "@/lib/format";

import { useChangelog } from "../queries";
import type { ChangelogEntry } from "../types";

export function ChangelogDrawer({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useChangelog(1, 20);

  const entries = data?.items ?? [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <SparklesIcon className="text-primary size-3.5" />
            <span>What&apos;s New</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <HistoryIcon className="text-primary size-4" />
            Product Changelog
          </SheetTitle>
          <SheetDescription className="text-xs">
            Latest improvements, fixes, and updates to the platform.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isLoading ? (
            <div className="text-muted-foreground flex h-32 items-center justify-center text-xs">
              Loading changelog...
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BookOpenIcon className="text-muted-foreground/50 size-8" />
              <p className="text-muted-foreground mt-2 text-xs">
                No changelog entries published yet.
              </p>
            </div>
          ) : (
            entries.map((entry: ChangelogEntry) => (
              <div key={entry.id} className="border-border/60 relative space-y-2 border-l-2 pl-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {entry.version}
                  </Badge>
                  <span className="text-muted-foreground text-[11px]">
                    {formatDate(entry.publishedAt)}
                  </span>
                </div>

                <h4 className="text-sm font-semibold">{entry.title}</h4>
                <div className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap">
                  {entry.body}
                </div>

                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {entry.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1 px-1.5 py-0 text-[10px] font-normal"
                      >
                        <TagIcon className="size-2.5" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
