#!/usr/bin/env bash
# Quick mobile Lighthouse numbers for a few paths (plan P9.11), one run each, against a running server.
#   bash scripts/lh-quick.sh http://localhost:3300 / /pol/laminat/
set -euo pipefail
base=$1; shift
LH=$(find "$(dirname "$0")/../../../node_modules/.pnpm" -path "*lighthouse/cli/index.js" | head -1)
export CHROME_PATH=${CHROME_PATH:-$(node -e "console.log(require('@playwright/test').chromium.executablePath())")}
for path in "$@"; do
  out=$(mktemp)
  node "$LH" "$base$path" --quiet --output=json --output-path="$out" --only-categories=performance \
    --chrome-flags="--headless=new --no-sandbox" >/dev/null 2>&1
  node -e '
    const r = JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")); const a = r.audits;
    const js = a["resource-summary"].details.items.find((i) => i.resourceType === "script").transferSize;
    console.log(process.argv[2].padEnd(16), "perf", r.categories.performance.score, "LCP", Math.round(a["largest-contentful-paint"].numericValue),
      "FCP", Math.round(a["first-contentful-paint"].numericValue), "TBT", Math.round(a["total-blocking-time"].numericValue), "JS", Math.round(js / 1024));
  ' "$out" "$path"
  rm -f "$out"
done
