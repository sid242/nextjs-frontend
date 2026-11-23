import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getStorageBaseUrl(): string {
  const envEndpoint = process.env.S3_ENDPOINT;
  if (envEndpoint) {
    try {
      const parsed = new URL(envEndpoint);
      return parsed.origin;
    } catch {
      /* ignore */
    }
  }
  return "http://127.0.0.1:9000";
}

function getAllowedStorageHosts(): Set<string> {
  const allowed = new Set<string>(["localhost", "localhost:9000", "127.0.0.1", "127.0.0.1:9000"]);

  const envEndpoint = process.env.S3_ENDPOINT;
  if (envEndpoint) {
    try {
      const parsed = new URL(envEndpoint);
      if (parsed.host) allowed.add(parsed.host.toLowerCase());
      if (parsed.hostname) allowed.add(parsed.hostname.toLowerCase());
    } catch {
      /* ignore */
    }
  }

  return allowed;
}

function isAllowedStorageHost(host: string): boolean {
  const normalized = host.toLowerCase().trim();
  const allowedHosts = getAllowedStorageHosts();
  if (allowedHosts.has(normalized)) {
    return true;
  }
  const hostname = normalized.split(":")[0] ?? "";
  return allowedHosts.has(hostname);
}

function resolveStorageTarget(rawPath: string[], search: string): string {
  if (rawPath.length === 0) {
    throw new Error("Empty storage path");
  }

  const firstSegment = decodeURIComponent(rawPath[0] ?? "");
  // If first segment looks like a host (e.g. contains a dot or colon)
  if (firstSegment.includes(".") || firstSegment.includes(":")) {
    if (isAllowedStorageHost(firstSegment) && rawPath.length > 1) {
      const relativePath = rawPath.slice(1).map(decodeURIComponent).join("/");
      return `http://${firstSegment}/${relativePath}${search}`;
    }
    throw new Error(`Storage host "${firstSegment}" is not permitted`);
  }

  // Legacy fallback: direct bucket path like ["app-uploads-local", ...]
  const relativePath = rawPath.map(decodeURIComponent).join("/");
  return `${getStorageBaseUrl()}/${relativePath}${search}`;
}

/**
 * Same-origin gateway to local development MinIO object storage.
 * Ensures that remote LAN devices (e.g. mobile testing at 192.168.x.x), subdomains,
 * and dev tunnels can seamlessly load and upload S3 assets without direct port 9000 access.
 *
 * Disabled completely in production to prevent SSRF and unauthorized internal proxying.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { path } = await params;
  if (!path || path.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  let targetUrl: string;
  try {
    targetUrl = resolveStorageTarget(path, req.nextUrl.search);
  } catch (err: unknown) {
    return new NextResponse(err instanceof Error ? err.message : "Invalid storage path", {
      status: 400,
    });
  }

  try {
    const upstreamRes = await fetch(targetUrl);
    if (upstreamRes.status === 304) {
      return new NextResponse(null, { status: 304 });
    }
    if (!upstreamRes.ok) {
      return new NextResponse(upstreamRes.statusText, { status: upstreamRes.status });
    }

    const contentType = upstreamRes.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = upstreamRes.headers.get("content-disposition");
    const body = await upstreamRes.arrayBuffer();

    const responseHeaders = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    });
    if (contentDisposition) {
      responseHeaders.set("Content-Disposition", contentDisposition);
    }

    return new NextResponse(body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    console.error("[Storage GET Gateway Error]:", err);
    return new NextResponse(err instanceof Error ? err.message : "Failed to fetch storage asset", {
      status: 502,
    });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { path } = await params;
  if (!path || path.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  let targetUrl: string;
  try {
    targetUrl = resolveStorageTarget(path, req.nextUrl.search);
  } catch (err: unknown) {
    return new NextResponse(err instanceof Error ? err.message : "Invalid storage path", {
      status: 400,
    });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    const body = await req.arrayBuffer();

    const upstreamRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        ...(contentType ? { "content-type": contentType } : {}),
      },
      body,
    });

    const isNullBodyStatus =
      upstreamRes.status === 204 || upstreamRes.status === 205 || upstreamRes.status === 304;

    const responseHeaders = new Headers();
    upstreamRes.headers.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      if (
        isNullBodyStatus &&
        (lowerKey === "content-type" ||
          lowerKey === "content-length" ||
          lowerKey === "transfer-encoding")
      ) {
        return;
      }
      responseHeaders.set(key, val);
    });

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
  } catch (err: unknown) {
    console.error("[Storage POST Gateway Error]:", err);
    return new NextResponse(
      err instanceof Error ? err.message : "Failed to upload asset to storage",
      { status: 502 },
    );
  }
}
