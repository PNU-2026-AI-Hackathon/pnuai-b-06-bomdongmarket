#!/bin/sh
set -eu

repo_root=$(git rev-parse --show-toplevel)
frontend_dir=${1:-"$repo_root/farmbroker-web"}

case "$frontend_dir" in
  /*) ;;
  *) frontend_dir="$repo_root/$frontend_dir" ;;
esac

package_json="$frontend_dir/package.json"
source_dir="$frontend_dir/src"

if [ ! -f "$package_json" ] || [ ! -d "$source_dir" ]; then
  echo "ERROR: expected package.json and src under: $frontend_dir" >&2
  echo "Usage: $0 [frontend-directory]" >&2
  exit 2
fi

echo "# Frontend UI pattern scan"
echo
echo "Frontend: $frontend_dir"
node -e '
const p = require(process.argv[1]);
const all = {...p.dependencies, ...p.devDependencies};
const stack = ["react", "react-dom", "react-router-dom", "vite", "typescript", "tailwindcss"]
  .filter((name) => all[name])
  .map((name) => `${name}@${all[name]}`);
console.log(`Stack: ${stack.join(", ") || "not detected"}`);
console.log(`Scripts: ${Object.keys(p.scripts || {}).sort().join(", ") || "none"}`);
' "$package_json"

echo
echo "## Routes and pages"
find "$source_dir" -type f \( -name '*Page.tsx' -o -name '*Page.jsx' -o -name '*Routes.tsx' -o -name 'router.tsx' \) -print | sed "s|$repo_root/||" | sort

echo
echo "## Shared components"
find "$source_dir/components" -type f \( -name '*.tsx' -o -name '*.jsx' \) -print 2>/dev/null | sed "s|$repo_root/||" | sort || true

echo
echo "## Repeated color literals"
rg -o --no-filename '#[0-9A-Fa-f]{3,8}\b|rgba?\([^)]*\)' \
  "$source_dir" "$frontend_dir/tailwind.config.ts" "$frontend_dir/tailwind.config.js" \
  -g '*.css' -g '*.scss' -g '*.ts' -g '*.tsx' -g '*.js' -g '*.jsx' 2>/dev/null \
  | sort | uniq -c | sort -nr | sed -n '1,40p' || true

echo
echo "## Repeated JSX component usage"
rg -o --no-filename '<[A-Z][A-Za-z0-9.]*' "$source_dir" -g '*.tsx' -g '*.jsx' 2>/dev/null \
  | sed 's/^<//' | sort | uniq -c | sort -nr | sed -n '1,50p' || true

echo
echo "## Tailwind arbitrary values"
rg -o --no-filename '[[:alnum:]-]+-\[[^]]+\]' "$source_dir" -g '*.tsx' -g '*.jsx' 2>/dev/null \
  | sort | uniq -c | sort -nr | sed -n '1,40p' || true

echo
echo "## Repeated spacing, radius, and shadow utilities"
rg -o --no-filename '\b([mp][trblxy]?-[0-9.]+|gap-[0-9.]+|space-[xy]-[0-9.]+|rounded(-[[:alnum:]-]+)?|shadow(-[[:alnum:]-]+)?)\b' \
  "$source_dir" -g '*.tsx' -g '*.jsx' 2>/dev/null \
  | sort | uniq -c | sort -nr | sed -n '1,60p' || true

echo
echo "Use these counts as evidence candidates, then inspect context before defining tokens or components."
