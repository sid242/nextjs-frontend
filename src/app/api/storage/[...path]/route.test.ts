import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { requestStorage } from "@/lib/server/storage-upstream";

import { GET, POST } from "./route";

vi.mock("@/lib/server/storage-upstream", () => ({ requestStorage: vi.fn() }));

describe("Storage Gateway Route Handler (/api/storage/[...path])", () => {
  const upstream = vi.mocked(requestStorage);

  beforeEach(() => {
    upstream.mockReset();
    vi.stubEnv("S3_ENDPOINT", "http://127.0.0.1:9000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("disables upload and download in production even with a configured endpoint", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const url = "http://localhost:3000/api/storage/app-uploads-local";
    const context = { params: Promise.resolve({ path: ["app-uploads-local"] }) };
    expect((await GET(new NextRequest(url), context)).status).toBe(404);
    expect((await POST(new NextRequest(url, { method: "POST" }), context)).status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("handles POST with upstream 204 No Content without crashing on null body", async () => {
    upstream.mockResolvedValue({
      status: 204,
      ok: true,
      headers: new Headers({
        etag: '"test-etag"',
        "x-amz-request-id": "req-123",
      }),
      text: vi.fn().mockResolvedValue(""),
    } as unknown as Response);

    const req = new NextRequest("http://192.168.1.25:3001/api/storage/app-uploads-local", {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=test",
      },
      body: new Uint8Array([1, 2, 3]),
    });

    const res = await POST(req, {
      params: Promise.resolve({ path: ["app-uploads-local"] }),
    });

    expect(res.status).toBe(204);
    expect(res.body).toBeNull();
    expect(res.headers.get("etag")).toBe('"test-etag"');
    expect(res.headers.get("x-amz-request-id")).toBe("req-123");
    expect(res.headers.get("content-type")).toBeNull();
  });

  it("handles POST with host-encoded path and forwards upstream", async () => {
    let capturedUrl = "";
    upstream.mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        status: 204,
        ok: true,
        headers: new Headers(),
      } as unknown as Response);
    });

    const req = new NextRequest(
      "http://192.168.1.25:3001/api/storage/192.168.1.25%3A9000/app-uploads-local",
      {
        method: "POST",
        headers: { "content-type": "multipart/form-data; boundary=test" },
        body: new Uint8Array([1, 2, 3]),
      },
    );

    const res = await POST(req, {
      params: Promise.resolve({ path: ["192.168.1.25:9000", "app-uploads-local"] }),
    });

    expect(res.status).toBe(204);
    expect(capturedUrl).toBe("http://127.0.0.1:9000/app-uploads-local");
    expect(upstream).toHaveBeenCalledWith(
      capturedUrl,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ host: "192.168.1.25:9000" }),
      }),
    );
  });

  it("handles POST with upstream 201 Created and forwards response body", async () => {
    upstream.mockResolvedValue({
      status: 201,
      ok: true,
      headers: new Headers({
        "content-type": "application/xml",
      }),
      text: vi.fn().mockResolvedValue("<PostResponse><Location>...</Location></PostResponse>"),
    } as unknown as Response);

    const req = new NextRequest("http://192.168.1.25:3001/api/storage/app-uploads-local", {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=test",
      },
      body: new Uint8Array([1, 2, 3]),
    });

    const res = await POST(req, {
      params: Promise.resolve({ path: ["app-uploads-local"] }),
    });

    expect(res.status).toBe(201);
    const text = await res.text();
    expect(text).toContain("<PostResponse>");
    expect(res.headers.get("content-type")).toBe("application/xml");
  });

  it("returns 502 if upstream fetch throws an error during POST", async () => {
    upstream.mockRejectedValue(new Error("Connection refused"));

    const req = new NextRequest("http://192.168.1.25:3001/api/storage/app-uploads-local", {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=test",
      },
      body: new Uint8Array([1, 2, 3]),
    });

    const res = await POST(req, {
      params: Promise.resolve({ path: ["app-uploads-local"] }),
    });

    expect(res.status).toBe(502);
    const text = await res.text();
    expect(text).toBe("Storage unavailable");
  });

  it("handles GET with host-encoded path and preserves content-disposition", async () => {
    const assetBytes = new Uint8Array([10, 20, 30, 40]);
    let capturedUrl = "";
    upstream.mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(assetBytes, {
          headers: new Headers({
            "content-type": "application/pdf",
            "content-disposition": 'inline; filename="doc.pdf"',
          }),
        }),
      );
    });

    const req = new NextRequest(
      "http://192.168.1.25:3001/api/storage/192.168.1.25%3A9000/app-uploads-local/test.pdf?sig=123",
    );

    const res = await GET(req, {
      params: Promise.resolve({ path: ["192.168.1.25:9000", "app-uploads-local", "test.pdf"] }),
    });

    expect(res.status).toBe(200);
    expect(capturedUrl).toBe("http://127.0.0.1:9000/app-uploads-local/test.pdf?sig=123");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe('inline; filename="doc.pdf"');
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBe(4);
  });

  it("handles GET with 304 Not Modified without attaching body", async () => {
    upstream.mockResolvedValue({
      status: 304,
      ok: false,
      headers: new Headers(),
    } as unknown as Response);

    const req = new NextRequest("http://192.168.1.25:3001/api/storage/app-uploads-local/test.png");

    const res = await GET(req, {
      params: Promise.resolve({ path: ["app-uploads-local", "test.png"] }),
    });

    expect(res.status).toBe(304);
    expect(res.body).toBeNull();
  });

  it("rejects an unconfigured storage authority before fetching", async () => {
    const req = new NextRequest("http://localhost:3001/api/storage/bucket/file.pdf");
    const res = await GET(req, {
      params: Promise.resolve({ path: ["storage.example.test:9000", "bucket", "file.pdf"] }),
    });
    expect(res.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("returns a gateway error without forwarding an upstream redirect", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 302, headers: { location: "/other" } }));
    const req = new NextRequest("http://localhost:3001/api/storage/bucket/file.pdf");
    const res = await GET(req, {
      params: Promise.resolve({ path: ["bucket", "file.pdf"] }),
    });
    expect(res.status).toBe(502);
    expect(res.headers.has("location")).toBe(false);
  });
});
