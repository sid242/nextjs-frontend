import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Server-Sent Events (SSE) Client Utilities", () => {
  let mockEventSourceInstances: MockEventSource[] = [];

  class MockEventSource {
    url: string;
    withCredentials?: boolean;
    listeners: Record<string, ((event: MessageEvent) => void)[]> = {};
    onopen: ((e: Event) => void) | null = null;
    onerror: ((e: Event) => void) | null = null;
    onmessage: ((e: MessageEvent) => void) | null = null;
    closed = false;

    constructor(url: string, init?: { withCredentials?: boolean }) {
      this.url = url;
      this.withCredentials = init?.withCredentials;
      mockEventSourceInstances.push(this);
    }

    addEventListener(event: string, handler: (e: MessageEvent) => void) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event]?.push(handler);
    }

    removeEventListener(event: string, handler: (e: MessageEvent) => void) {
      this.listeners[event] = this.listeners[event]?.filter((h) => h !== handler) ?? [];
    }

    close() {
      this.closed = true;
    }
  }

  beforeEach(() => {
    mockEventSourceInstances = [];
    vi.stubGlobal("EventSource", MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("configures EventSource instance with withCredentials enabled for same-origin proxy", () => {
    const source = new MockEventSource("/api/proxy/files/events/stream", { withCredentials: true });

    expect(mockEventSourceInstances.length).toBe(1);
    expect(source.url).toBe("/api/proxy/files/events/stream");
    expect(source.withCredentials).toBe(true);
    expect(source.closed).toBe(false);

    source.close();
    expect(source.closed).toBe(true);
  });

  it("handles incoming named SSE events and parses JSON payload", () => {
    const processedHandler = vi.fn();
    const source = new MockEventSource("/api/proxy/files/events/stream");
    source.addEventListener("file:processed", (e) => {
      const data: unknown = JSON.parse(e.data);
      processedHandler(data);
    });

    const listeners = source.listeners["file:processed"];
    expect(listeners?.length).toBe(1);

    listeners?.[0]?.({
      data: JSON.stringify({ fileId: "file-xyz-123" }),
    } as MessageEvent);

    expect(processedHandler).toHaveBeenCalledWith({ fileId: "file-xyz-123" });
  });

  it("cleans up event listeners when closing EventSource connection", () => {
    const source = new MockEventSource("/api/proxy/files/events/stream");
    const listener = vi.fn();

    source.addEventListener("file:processed", listener);
    expect(source.listeners["file:processed"]?.length).toBe(1);

    source.removeEventListener("file:processed", listener);
    expect(source.listeners["file:processed"]?.length).toBe(0);
  });
});
