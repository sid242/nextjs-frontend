import { NextResponse } from "next/server";
import { backendUrl } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

// Readiness: can we reach the backend? Use this for load-balancer target health, not for container restarts.
export async function GET() {
  try {
    const base = backendUrl("/").replace(/\/api\/v1\/?$/, "");
    const res = await fetch(`${base}/health/ready`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    return NextResponse.json(
      { status: res.ok ? "ok" : "degraded" },
      { status: res.ok ? 200 : 503 },
    );
  } catch {
    return NextResponse.json({ status: "degraded" }, { status: 503 });
  }
}
