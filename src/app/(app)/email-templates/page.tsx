"use client";

import { PageHeader } from "@/components/molecules/page-header";
import { TemplatesTable } from "@/features/email-templates";

export default function EmailTemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Templates"
        description="Create, customize, and manage responsive email templates with dynamic merge variables and real-time device previews."
      />

      <TemplatesTable />
    </div>
  );
}
