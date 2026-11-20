#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");

const pattern =
  /(?:href|push|replace|redirect)\s*\(?[\s=]*["'`]\/(dashboard|team|roles|files|settings|audit-logs|email-templates|branding|groups|billing)/;

const ALLOWLIST = [
  "proxy.ts",
  "paths.ts",
  "after-login.ts",
  "urls.ts",
  "urls.test.ts",
  "host.test.ts",
  "routes.ts",
  ".test.ts",
  ".test.tsx",
];

function isAllowlisted(relPath) {
  const norm = relPath.replace(/\\/g, "/");
  return ALLOWLIST.some((allowed) => norm.endsWith(allowed) || norm.includes(allowed));
}

function walk(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      results.push(full);
    }
  }
  return results;
}

const files = walk(srcDir);
const violations = [];

for (const file of files) {
  const relPath = path.relative(srcDir, file);
  if (isAllowlisted(relPath)) continue;

  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    if (pattern.test(line)) {
      violations.push({
        file: relPath.replace(/\\/g, "/"),
        line: idx + 1,
        code: line.trim(),
      });
    }
  });
}

if (violations.length > 0) {
  console.error(
    `\x1b[31m[check-tenant-hrefs] Found ${violations.length} unscoped tenant href(s):\x1b[0m\n`,
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} -> ${v.code}`);
  }
  console.error(
    "\nPlease use `useTenantHref()` (client) or `tenantHref(ctx, ...)` (server) instead of hardcoding unscoped tenant paths.",
  );
  process.exit(1);
} else {
  console.log("\x1b[32m[check-tenant-hrefs] All tenant links are properly scoped!\x1b[0m");
  process.exit(0);
}
