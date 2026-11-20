import type { NextConfig } from "next";

function getAllowedDevOrigins(): string[] {
  const explicit = (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const origins = new Set<string>(explicit);
  for (const item of explicit) {
    if (!item.includes(":")) {
      origins.add(`${item}:3001`);
    }
  }

  // Fallback: extract hostname from SOCKET_URL if configured for LAN testing
  const socketUrl = process.env.SOCKET_URL ?? process.env.NEXT_PUBLIC_SOCKET_URL;
  if (socketUrl) {
    try {
      const parsed = new URL(socketUrl);
      if (parsed.hostname && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
        origins.add(parsed.hostname);
        origins.add(`${parsed.hostname}:3001`);
      }
    } catch {
      /* ignore invalid URL */
    }
  }

  return Array.from(origins);
}

const allowedDevOrigins = getAllowedDevOrigins();

const nextConfig: NextConfig = {
  // Self-contained server bundle => tiny Docker image (see Dockerfile).
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
  // Static security headers. The per-request CSP (with nonce) is set in src/proxy.ts.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
