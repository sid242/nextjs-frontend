import "server-only";

import { z } from "zod";

const schema = z.object({
  API_URL: z.string().url(),
  SOCKET_URL: z.string().url(),
  CSP_CONNECT_EXTRA: z.string().default(""),
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
