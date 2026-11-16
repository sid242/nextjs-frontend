"use client";

import { PageHeader } from "@/components/molecules/page-header";
import { LeadsTable } from "@/features/leads";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM Leads"
        description="View and manage prospective deals. Access to records is dynamically filtered and scoped by your active workspace PBAC policies."
      />
      <LeadsTable />
    </div>
  );
}
