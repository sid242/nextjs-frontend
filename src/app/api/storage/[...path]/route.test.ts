import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

describe("Storage Gateway Route Handler (/api/storage/[...path])", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("handles POST with upstream 204 No Content without crashing on null body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
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
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
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
    expect(capturedUrl).toBe("http://192.168.1.25:9000/app-uploads-local");
  });

  it("handles POST with upstream 201 Created and forwards response body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
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
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

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
    expect(text).toBe("Connection refused");
  });

  it("handles GET with host-encoded path and preserves content-disposition", async () => {
    const assetBytes = new Uint8Array([10, 20, 30, 40]);
    let capturedUrl = "";
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        status: 200,
        ok: true,
        headers: new Headers({
          "content-type": "application/pdf",
          "content-disposition": 'inline; filename="doc.pdf"',
        }),
        arrayBuffer: vi.fn().mockResolvedValue(assetBytes.buffer),
      } as unknown as Response);
    });

    const req = new NextRequest(
      "http://192.168.1.25:3001/api/storage/192.168.1.25%3A9000/app-uploads-local/test.pdf?sig=123",
    );

    const res = await GET(req, {
      params: Promise.resolve({ path: ["192.168.1.25:9000", "app-uploads-local", "test.pdf"] }),
    });

    expect(res.status).toBe(200);
    expect(capturedUrl).toBe("http://192.168.1.25:9000/app-uploads-local/test.pdf?sig=123");
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe('inline; filename="doc.pdf"');
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBe(4);
  });

  it("handles GET with 304 Not Modified without attaching body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
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
});
