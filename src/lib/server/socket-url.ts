import type { NextRequest } from "next/server";

import { getEnv } from "@/lib/server/env";

/**
 * Resolves the public Socket.IO endpoint for the incoming browser request.
 * In local development on LAN (e.g. 192.168.x.x), rewrites localhost/127.0.0.1 to the request host.
 */
export function resolveClientSocketUrl(req: NextRequest): string {
  let url = getEnv().SOCKET_URL;
  if (process.env.NODE_ENV === "development") {
    try {
      const socketParsed = new URL(url);
      const reqHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
      if (reqHost) {
        const clientHostname = reqHost.split(":")[0];
        if (
          clientHostname &&
          clientHostname !== "localhost" &&
          clientHostname !== "127.0.0.1" &&
          (socketParsed.hostname === "localhost" || socketParsed.hostname === "127.0.0.1")
        ) {
          socketParsed.hostname = clientHostname;
          url = socketParsed.toString();
        }
      }
    } catch {
      /* ignore invalid URL */
    }
  }
  return url;
}
