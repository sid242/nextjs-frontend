import "server-only";

import { z } from "zod";

const schema = z.object({
  API_URL: z.string().url(),
  SOCKET_URL: z.string().url(),
  CSP_CONNECT_EXTRA: z.string().default(""),
  CSP_FRAME_EXTRA: z.string().default(""),
  BFF_SHARED_SECRET: z.string().default("bff-dev-shared-secret-key-min-16-chars"),
  NEXT_PUBLIC_APP_BASE_DOMAIN: z.string().default("localhost:3001"),
  NEXT_PUBLIC_APP_PROTOCOL: z.enum(["http", "https"]).default("http"),
  PLATFORM_HOST: z.string().default("localhost:3001"),
  RESERVED_SUBDOMAINS: z.string().default("www,api,app,admin,platform,auth,static,cdn,mail,status"),
  TRUST_PROXY: z.string().optional().default("false"),
});

export type ServerEnv = z.infer<typeof schema>;
let cached: ServerEnv | undefined;

/** Lazy + memoised so `next build` doesn't need runtime env, but a bad deploy fails loudly on first request. */
export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
    );
  }
  cached = parsed.data;
  return cached;
}
