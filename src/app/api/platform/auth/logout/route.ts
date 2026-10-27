import type { NextRequest } from "next/server";

import { handlePlatformLogoutRequest } from "@/lib/server/platform-auth";

export const dynamic = "force-dynamic";

export const POST = (req: NextRequest) => handlePlatformLogoutRequest(req);
