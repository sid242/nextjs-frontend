import type { NextRequest } from "next/server";

import { handlePlatform2FaVerifyRequest } from "@/lib/server/platform-auth";

export const dynamic = "force-dynamic";

export const POST = (req: NextRequest) => handlePlatform2FaVerifyRequest(req);
