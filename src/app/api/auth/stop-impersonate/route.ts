import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, IMPERSONATOR_BACKUP_COOKIE } from "@/lib/auth/constants";
import { backendFetch } from "@/lib/server/backend";
import { assertSameOrigin, forwardedHeaders } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const currentToken = req.cookies.get(ACCESS_COOKIE)?.value;
  const adminBackupToken = req.cookies.get(IMPERSONATOR_BACKUP_COOKIE)?.value;

  if (!adminBackupToken) {
    return errorResponse(400, "NOT_IMPERSONATING", "No active impersonation session");
  }

  // Notify backend to clean up session in Redis
  if (currentToken) {
    await backendFetch("/auth/stop-impersonate", {
      method: "POST",
      token: currentToken,
      headers: forwardedHeaders(req),
    }).catch(() => undefined);
  }

  const secure = process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";
  const res = NextResponse.json({ ok: true });

  // Restore the admin's original access token
  res.cookies.set(ACCESS_COOKIE, adminBackupToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  // Clear the backup cookie
  res.cookies.set(IMPERSONATOR_BACKUP_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
