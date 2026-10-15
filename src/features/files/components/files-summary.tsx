"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFiles } from "../queries";

export function FilesSummary() {
  const { data, isPending, isError } = useFiles();
  const uploaded = data?.filter((f) => f.status === "UPLOADED").length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardDescription>Your files</CardDescription>
        <CardTitle className="text-3xl">
          {isPending ? <Skeleton className="h-8 w-16" /> : isError ? "—" : data.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        {isPending || isError ? " " : `${uploaded} uploaded, ${data.length - uploaded} pending`}
      </CardContent>
    </Card>
  );
}
