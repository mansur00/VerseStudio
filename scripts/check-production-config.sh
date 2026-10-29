#!/usr/bin/env bash
set -e

echo "=== Running Production Config & Dist Leak Verification ==="

EXT_DIST="apps/extension/dist"

if [ ! -d "$EXT_DIST" ]; then
  echo "Error: $EXT_DIST directory does not exist. Run 'pnpm --filter @verse-studio/extension build' first."
  exit 1
fi

echo "1. Scanning $EXT_DIST for unconfigured localhost or 127.0.0.1 leaks..."

# Grep for localhost or 127.0.0.1 in dist files (excluding source maps or comments if any)
LEAKS=$(grep -rn "localhost\|127\.0\.0\.1" "$EXT_DIST" || true)

if [ -n "$LEAKS" ]; then
  echo "❌ FAILED: Found hardcoded localhost or 127.0.0.1 in $EXT_DIST:"
  echo "$LEAKS"
  exit 1
fi

echo "✓ PASSED: No localhost or 127.0.0.1 found in $EXT_DIST."

echo "2. Checking manifest.json host_permissions in $EXT_DIST..."
MANIFEST="$EXT_DIST/manifest.json"
if [ ! -f "$MANIFEST" ]; then
  echo "Error: $MANIFEST not found."
  exit 1
fi

cat "$MANIFEST" | grep -A 5 "host_permissions" || {
  echo "❌ FAILED: manifest.json missing host_permissions."
  exit 1
}

echo "✓ PASSED: Extension distribution is configured cleanly for production."

