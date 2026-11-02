#!/usr/bin/env bash
set -euo pipefail

echo "Checking for unscoped tenant hrefs in src/..."

# Matches href="/dashboard", href="/team", etc.
# Excludes allow-listed marketing / public landing files
MATCHES=$(grep -rnE 'href="/(dashboard|team|roles|files|settings|audit-logs|email-templates|branding|billing)' src \
  | grep -v "node_modules" \
  | grep -v "site.ts" \
  | grep -v "src/app/(marketing)" \
  | grep -v "src/app/page.tsx" || true)

if [ -n "$MATCHES" ]; then
  echo "ERROR: Found unscoped tenant href(s) in frontend source code:"
  echo "$MATCHES"
  echo "Use useTenantHref() or tenantHref(ctx, path) instead of static hardcoded hrefs."
  exit 1
fi

echo "CI Check Passed: All tenant links are scoped."

