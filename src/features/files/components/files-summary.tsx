"use client";

import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { FileRecord } from "@/lib/api/types";

import { useFiles } from "../queries";

export function FilesSummary() {
  const { data, isPending, isError } = useFiles();
  const fileList = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && Array.isArray((data as { data?: FileRecord[] }).data)) {
      return (data as { data: FileRecord[] }).data;
    }
    return [];
  }, [data]);
  const uploaded = fileList?.filter((f) => f?.status === "UPLOADED")?.length ?? 0;
  const total = fileList?.length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardDescription>Your files</CardDescription>
        <CardTitle className="text-3xl">
          {isPending ? <Skeleton className="h-8 w-16" /> : isError ? "—" : total}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        {isPending || isError ? " " : `${uploaded} uploaded, ${total - uploaded} pending`}
      </CardContent>
    </Card>
  );
}
