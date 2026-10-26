"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TemplateStudio, useEmailTemplate } from "@/features/email-templates";

export default function EditEmailTemplatePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data: template, isLoading, isError } = useEmailTemplate(id);

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-3">
        <Spinner className="text-primary size-7" />
        <span className="text-muted-foreground text-sm">Loading template workspace...</span>
      </div>
    );
  }

  if (isError || !template) {
    return (
      <div className="border-border bg-card flex flex-col items-center justify-center space-y-4 rounded-lg border p-12 text-center">
        <div className="space-y-1">
          <h2 className="text-foreground text-base font-semibold">Template Not Found</h2>
          <p className="text-muted-foreground text-xs">
            The requested email template does not exist or has been removed.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <Link href="/email-templates">
            <ArrowLeftIcon className="size-3.5" />
            <span>Return to Templates</span>
          </Link>
        </Button>
      </div>
    );
  }

  return <TemplateStudio initialTemplate={template} />;
}
