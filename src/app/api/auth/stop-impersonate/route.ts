import type { NextRequest } from "next/server";

import { handleStopImpersonateRequest } from "@/lib/server/impersonation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleStopImpersonateRequest(req);
}
