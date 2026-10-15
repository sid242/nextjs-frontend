import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/molecules/page-header";
import { FilesTable, FileUploader, prefetchFiles } from "@/features/files";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Files" };

export default async function FilesPage() {
  const queryClient = getServerQueryClient();
  await prefetchFiles(queryClient); // the table renders with data on first paint

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="grid gap-6">
        <PageHeader title="Files" description="Upload and manage your documents and images." />
        <FileUploader />
        <FilesTable />
      </div>
    </HydrationBoundary>
  );
}
