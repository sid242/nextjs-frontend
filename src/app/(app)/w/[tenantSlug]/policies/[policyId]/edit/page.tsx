"use client";

import { useParams } from "next/navigation";

import { PolicyFormPage } from "@/features/policies";

export default function EditPolicyRoute() {
  const params = useParams<{ policyId: string }>();
  return <PolicyFormPage policyId={params?.policyId} />;
}
