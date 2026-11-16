"use client";

import { useParams } from "next/navigation";

import { LeadFormPage } from "@/features/leads";

export default function EditLeadRoute() {
  const params = useParams<{ leadId: string }>();
  return <LeadFormPage leadId={params?.leadId} />;
}
