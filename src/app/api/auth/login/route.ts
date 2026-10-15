import type { NextRequest } from "next/server";
import { handleCredentials } from "@/lib/server/credentials";

export const dynamic = "force-dynamic";

export const POST = (req: NextRequest) => handleCredentials(req, "/auth/login");
