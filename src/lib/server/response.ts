import { NextResponse } from "next/server";

export function errorResponse(
  status: number,
  code: string,
  message: string,
  headers?: Record<string, string>,
) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
}

/**
 * Redirect with a RELATIVE Location header. NextResponse.redirect needs an absolute URL, which behind
 * a load balancer can end up as the container's internal host (e.g. 0.0.0.0:3000).
 */
export function redirectTo(location: string) {
  return new NextResponse(null, {
    status: 307,
    headers: { Location: location, "Cache-Control": "no-store" },
  });
}
