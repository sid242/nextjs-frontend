import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { Readable } from "node:stream";

export function requestStorage(
  url: string,
  {
    method,
    headers,
    body,
    signal,
  }: {
    method: "GET" | "POST";
    headers: Record<string, string>;
    body?: ArrayBuffer;
    signal: AbortSignal;
  },
): Promise<Response> {
  const request = url.startsWith("https:") ? httpsRequest : httpRequest;
  return new Promise((resolve, reject) => {
    const outgoing = request(url, { method, headers, signal }, (incoming) => {
      const status = incoming.statusCode ?? 502;
      if (status >= 300 && status < 400) {
        incoming.resume();
        resolve(new Response(null, { status }));
        return;
      }
      const forwarded = new Headers();
      for (const name of ["content-type", "content-disposition", "etag", "x-amz-request-id"]) {
        const value = incoming.headers[name];
        if (typeof value === "string") forwarded.set(name, value);
      }
      const hasBody = status !== 204 && status !== 205;
      if (!hasBody) incoming.resume();
      const stream = hasBody ? (Readable.toWeb(incoming) as ReadableStream<Uint8Array>) : null;
      resolve(new Response(stream, { status, headers: forwarded }));
    });
    outgoing.on("error", reject);
    outgoing.setTimeout(30_000, () => outgoing.destroy(new Error("Storage request timed out")));
    outgoing.end(body ? Buffer.from(body) : undefined);
  });
}
