import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Liveness: is this Next.js process up? (no dependency checks, so a backend blip never restarts us)
export function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
