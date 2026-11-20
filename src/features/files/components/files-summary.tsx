"use client";

import { Archive, Files, FileText, HardDrive, Image } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes } from "@/lib/format";

import { useStorageStats } from "../queries";

export function FilesSummary() {
  const { data: stats, isPending, isError } = useStorageStats();

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return null;
  }

  const categoryMap: Record<string, { label: string; icon: typeof FileText }> = {
    images: { label: "Images", icon: Image },
    documents: { label: "Documents", icon: FileText },
    archives: { label: "Archives", icon: Archive },
    other: { label: "Other", icon: Files },
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
          <HardDrive className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBytes(stats?.totalBytes ?? 0)}</div>
          <p className="text-muted-foreground text-xs">
            {stats?.totalFiles ?? 0} active files ({stats?.deletedFiles ?? 0} in trash)
          </p>
        </CardContent>
      </Card>

      {(stats?.categoryBreakdown ?? []).map((cat) => {
        const meta = categoryMap[cat?.category] ?? { label: cat?.category, icon: Files };
        const Icon = meta.icon;
        return (
          <Card key={cat?.category}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{meta.label}</CardTitle>
              <Icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(cat?.bytes ?? 0)}</div>
              <p className="text-muted-foreground text-xs">{cat?.count ?? 0} files</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
