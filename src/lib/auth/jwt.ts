export interface JwtClaims {
  sub?: string;
  role?: string;
  exp?: number;
  iat?: number;
  jti?: string;
}

/**
 * Decode (NOT verify) a JWT payload. Fine for UI decisions such as cookie lifetime;
 * the backend verifies the signature on every request.
 */
export function decodeJwt(token: string): JwtClaims | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as JwtClaims;
  } catch {
    return null;
  }
}
