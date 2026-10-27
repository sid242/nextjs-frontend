import type { NextRequest } from "next/server";

import { handlePlatformLoginRequest } from "@/lib/server/platform-auth";

export const dynamic = "force-dynamic";

export const POST = (req: NextRequest) => handlePlatformLoginRequest(req);
