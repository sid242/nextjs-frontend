import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/server/request";
import { requestStorage } from "@/lib/server/storage-upstream";

export const dynamic = "force-dynamic";

const cacheHeaders = { "Cache-Control": "private, no-store" };

function isAllowedStorageHost(signedHost: string, upstreamHost: string, req: NextRequest): boolean {
  const cleanSigned = signedHost.toLowerCase().trim();
  const signedHostname = cleanSigned.split(":")[0] ?? "";
  if (!signedHostname) return false;

  const upstreamHostname = upstreamHost.toLowerCase().split(":")[0] ?? "";

  // Upstream host match (e.g. 127.0.0.1:9000)
  if (cleanSigned === upstreamHost.toLowerCase()) return true;
  if (signedHostname === upstreamHostname) return true;

  // Localhost, loopback, or .localhost
  if (
    signedHostname === "localhost" ||
    signedHostname === "127.0.0.1" ||
    signedHostname === "0.0.0.0" ||
    signedHostname.endsWith(".localhost")
  ) {
    return true;
  }

  // Host from request headers
  const reqHost =
    req.headers.get("x-client-host") ??
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    req.nextUrl.host ??
    "";
  const reqHostname = (reqHost.split(",")[0] ?? "").trim().split(":")[0]?.toLowerCase() ?? "";
  if (reqHostname && signedHostname === reqHostname) return true;

  // In development, also accept private RFC 1918 LAN IPs and explicit ALLOWED_DEV_ORIGINS
  if (process.env.NODE_ENV !== "production") {
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(signedHostname)) {
      return true;
    }
    const devOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (devOrigins.some((orig) => orig.includes(signedHostname))) {
      return true;
    }
  }

  return false;
}

function resolveStorageTarget(req: NextRequest, path: string[]) {
  const endpoint = process.env.S3_ENDPOINT ?? "http://127.0.0.1:9000";
  if (path.length === 0) return null;

  let upstream: URL;
  try {
    upstream = new URL(endpoint);
  } catch {
    return null;
  }
  if (
    !["http:", "https:"].includes(upstream.protocol) ||
    upstream.username ||
    upstream.password ||
    upstream.pathname !== "/" ||
    upstream.search ||
    upstream.hash
  )
    return null;

  const authority = path[0]?.toLowerCase() ?? "";
  const hasAuthority =
    authority.includes(":") || isAllowedStorageHost(authority, upstream.host, req);
  const signedHost = hasAuthority ? authority : upstream.host;
  const objectPath = hasAuthority ? path.slice(1) : path;
  if (
    !isAllowedStorageHost(signedHost, upstream.host, req) ||
    !objectPath.length ||
    objectPath.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    return null;
  }

  // Preserve the host used for signing while connecting to the configured origin.
  upstream.pathname = "/" + objectPath.map(encodeURIComponent).join("/");
  upstream.search = req.nextUrl.search;
  return {
    url: upstream.toString(),
    headers: { host: signedHost },
  };
}

function unavailable() {
  return new NextResponse("Storage unavailable", { status: 502, headers: cacheHeaders });
}

/**
 * Same-origin gateway to local development MinIO object storage.
 * Ensures that remote LAN devices (e.g. mobile testing at 192.168.x.x), subdomains,
 * and dev tunnels can seamlessly load and upload S3 assets without direct port 9000 access.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404, headers: cacheHeaders });
  }
  const { path } = await params;
  const target = resolveStorageTarget(req, path);
  if (!target) return new NextResponse("Not Found", { status: 404, headers: cacheHeaders });

  try {
    const upstreamRes = await requestStorage(target.url, {
      method: "GET",
      headers: target.headers,
      signal: req.signal,
    });
    if (upstreamRes.status === 304) {
      return new NextResponse(null, { status: 304, headers: cacheHeaders });
    }
    if (upstreamRes.status >= 300 && upstreamRes.status < 400) return unavailable();
    if (!upstreamRes.ok) {
      await upstreamRes.body?.cancel();
      return new NextResponse(upstreamRes.statusText, {
        status: upstreamRes.status,
        headers: cacheHeaders,
      });
    }

    const contentType = upstreamRes.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = upstreamRes.headers.get("content-disposition");
    const responseHeaders = new Headers({
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      ...cacheHeaders,
    });
    if (contentDisposition) {
      responseHeaders.set("Content-Disposition", contentDisposition);
    }

    return new NextResponse(upstreamRes.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch {
    return unavailable();
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404, headers: cacheHeaders });
  }
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  const { path } = await params;
  const target = resolveStorageTarget(req, path);
  if (!target) return new NextResponse("Not Found", { status: 404, headers: cacheHeaders });

  try {
    const contentType = req.headers.get("content-type") || "";
    const body = await req.arrayBuffer();

    const upstreamRes = await requestStorage(target.url, {
      method: "POST",
      headers: {
        ...target.headers,
        ...(contentType ? { "content-type": contentType } : {}),
        "content-length": String(body.byteLength),
      },
      body,
      signal: req.signal,
    });

    if (upstreamRes.status >= 300 && upstreamRes.status < 400 && upstreamRes.status !== 304) {
      return unavailable();
    }
    const isNullBodyStatus =
      upstreamRes.status === 204 || upstreamRes.status === 205 || upstreamRes.status === 304;

    const responseHeaders = new Headers(cacheHeaders);
    for (const name of ["etag", "x-amz-request-id"]) {
      const value = upstreamRes.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    if (isNullBodyStatus) {
      return new NextResponse(null, {
        status: upstreamRes.status,
        headers: responseHeaders,
      });
    }

    const resBody = await upstreamRes.text();
    if (!responseHeaders.has("content-type")) {
      responseHeaders.set("content-type", upstreamRes.headers.get("content-type") || "text/plain");
    }

    return new NextResponse(resBody, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch {
    return unavailable();
  }
}
