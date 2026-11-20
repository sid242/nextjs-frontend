import { redirect } from "next/navigation";

import { PLATFORM_ROUTES } from "@/config/routes";

export default function PlatformRootPage() {
  redirect(PLATFORM_ROUTES.DASHBOARD);
}
