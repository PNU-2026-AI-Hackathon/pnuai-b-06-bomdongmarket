#!/bin/sh
set -u

repo_root=$(git rev-parse --show-toplevel)
frontend_dir=${1:-"$repo_root/farmbroker-web"}

case "$frontend_dir" in
  /*) ;;
  *) frontend_dir="$repo_root/$frontend_dir" ;;
esac

package_json="$frontend_dir/package.json"

if [ ! -f "$package_json" ]; then
  echo "ERROR: package.json not found: $package_json" >&2
  echo "Usage: $0 [frontend-directory]" >&2
  exit 2
fi

has_script() {
  node -e 'const p=require(process.argv[1]); process.exit(p.scripts && p.scripts[process.argv[2]] ? 0 : 1)' \
    "$package_json" "$1"
}

run_script() {
  script_name=$1
  if has_script "$script_name"; then
    echo
    echo "==> npm run $script_name"
    if (cd "$frontend_dir" && npm run "$script_name"); then
      return 0
    fi
    echo "FAIL: npm run $script_name" >&2
    return 1
  else
    echo
    echo "SKIP: npm script '$script_name' is not declared in $package_json"
    return 0
  fi
}

status=0

run_script lint || status=1

if has_script typecheck; then
  run_script typecheck || status=1
elif [ -f "$frontend_dir/tsconfig.json" ] && [ -x "$frontend_dir/node_modules/.bin/tsc" ]; then
  echo
  echo "==> local TypeScript compiler --noEmit"
  if ! (cd "$frontend_dir" && ./node_modules/.bin/tsc --noEmit); then
    echo "FAIL: local TypeScript compiler --noEmit" >&2
    status=1
  fi
else
  echo
  echo "SKIP: no declared typecheck script or installed local TypeScript compiler"
fi

run_script test || status=1
run_script build || status=1

echo
if [ "$status" -eq 0 ]; then
  echo "Frontend validation completed successfully."
else
  echo "Frontend validation completed with failures." >&2
fi

exit "$status"
