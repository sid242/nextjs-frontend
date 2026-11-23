import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getStorageBaseUrl(): string {
  const envEndpoint = process.env.S3_ENDPOINT;
  if (envEndpoint) {
    try {
      const parsed = new URL(envEndpoint);
      const port = parsed.port || "9000";
      return `http://127.0.0.1:${port}`;
    } catch {
      /* ignore */
    }
  }
  return "http://127.0.0.1:9000";
}

function isAllowedStorageHost(host: string): boolean {
  const h = host.toLowerCase().split(":")[0] ?? "";
  if (!h) return false;
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h.endsWith(".localhost") ||
    /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(h)
  );
}

function resolveStorageTarget(rawPath: string[], search: string): string {
  if (rawPath.length === 0) {
    throw new Error("Empty storage path");
  }

  const firstSegment = decodeURIComponent(rawPath[0] ?? "");
  // If first segment is an allowed local/LAN host (e.g. "192.168.1.25:9000" or "localhost:9000")
  if (isAllowedStorageHost(firstSegment) && rawPath.length > 1) {
    const relativePath = rawPath.slice(1).map(decodeURIComponent).join("/");
    return `http://${firstSegment}/${relativePath}${search}`;
  }

  // Legacy fallback: direct bucket path like ["app-uploads-local", ...]
  const relativePath = rawPath.map(decodeURIComponent).join("/");
  return `${getStorageBaseUrl()}/${relativePath}${search}`;
}

/**
 * Same-origin gateway to local development MinIO object storage.
 * Ensures that remote LAN devices (e.g. mobile testing at 192.168.x.x), subdomains,
 * and dev tunnels can seamlessly load and upload S3 assets without direct port 9000 access.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (!path || path.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const targetUrl = resolveStorageTarget(path, req.nextUrl.search);

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
  const { path } = await params;
  if (!path || path.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const targetUrl = resolveStorageTarget(path, req.nextUrl.search);

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
