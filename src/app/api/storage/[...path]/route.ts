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

  const relativePath = path.map(decodeURIComponent).join("/");
  const targetUrl = `${getStorageBaseUrl()}/${relativePath}${req.nextUrl.search}`;

  try {
    const upstreamRes = await fetch(targetUrl);
    if (!upstreamRes.ok) {
      return new NextResponse(upstreamRes.statusText, { status: upstreamRes.status });
    }

    const contentType = upstreamRes.headers.get("content-type") || "application/octet-stream";
    const body = await upstreamRes.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err: unknown) {
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

  const relativePath = path.map(decodeURIComponent).join("/");
  const targetUrl = `${getStorageBaseUrl()}/${relativePath}${req.nextUrl.search}`;

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

    const resBody = await upstreamRes.text();
    return new NextResponse(resBody, {
      status: upstreamRes.status,
      headers: {
        "Content-Type": upstreamRes.headers.get("content-type") || "text/plain",
      },
    });
  } catch (err: unknown) {
    return new NextResponse(
      err instanceof Error ? err.message : "Failed to upload asset to storage",
      { status: 502 },
    );
  }
}
