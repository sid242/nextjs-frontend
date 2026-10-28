import { redirect } from "next/navigation";

interface SettingsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const resolved = await searchParams;
  const tab = resolved?.tab;

  if (tab === "workspace") redirect("/settings/workspace");
  if (tab === "smtp" || tab === "email") redirect("/settings/email");
  if (tab === "security") redirect("/settings/security");

  redirect("/settings/profile");
}
