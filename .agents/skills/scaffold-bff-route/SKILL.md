---
name: scaffold-bff-route
description: >-
  Create or update Backend-For-Frontend (BFF) API route handlers in src/app/api/ with proper CSRF origin checks,
  httpOnly cookie handling, upstream proxying via backendFetch, tracing headers, and standard error responses.
---

# BFF Route Scaffolding Workflow

Follow this procedure when creating new API route handlers under `src/app/api/`.

## 1. Principles of the BFF Layer

- **Same-Origin Security**: Routes are called on the same origin from the browser. No cross-origin REST credentials needed.
- **CSRF Defense**: On mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`), verify origin via `assertSameOrigin(req)`.
- **Token Injection**: Read access token from `ACCESS_COOKIE` and forward as `Bearer` token to upstream API.
- **Tracing**: Preserve or generate `x-request-id` headers for end-to-end distributed tracing.
- **Server Isolation**: Always import `server-only` helpers from `@/lib/server/*`. Never import Axios client instances.

---

## 2. Route Handler Template

Create `src/app/api/<route-name>/route.ts`:

```typescript
import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { backendFetch } from "@/lib/server/backend";
import { assertSameOrigin, forwardedHeaders } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return errorResponse(401, "UNAUTHORIZED", "Not signed in");

  try {
    const upstream = await backendFetch("/my-endpoint", {
      method: "GET",
      token,
      search: req.nextUrl.search,
      headers: forwardedHeaders(req),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Service temporarily unavailable");
  }
}

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return errorResponse(401, "UNAUTHORIZED", "Not signed in");

  const body = await req.json();

  try {
    const upstream = await backendFetch("/my-endpoint", {
      method: "POST",
      token,
      json: body,
      headers: forwardedHeaders(req),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Service temporarily unavailable");
  }
}
```

---

## 3. Verification

Always verify new route handlers by running:

```bash
npm run check
```

Ensure TypeScript passes and the production build (`npm run build`) discovers the dynamic route correctly.
