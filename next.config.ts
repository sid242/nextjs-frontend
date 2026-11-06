import type { NextConfig } from "next";

function getAllowedDevOrigins(): string[] {
  const explicit = (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (explicit.length > 0) return explicit;

  // Fallback: extract hostname from SOCKET_URL if configured for LAN testing
  const socketUrl = process.env.SOCKET_URL ?? process.env.NEXT_PUBLIC_SOCKET_URL;
  if (socketUrl) {
    try {
      const parsed = new URL(socketUrl);
      if (parsed.hostname && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
        return [parsed.hostname];
      }
    } catch {
      /* ignore invalid URL */
    }
  }

  return [];
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
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
