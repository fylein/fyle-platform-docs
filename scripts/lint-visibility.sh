#!/usr/bin/env bash

set -euo pipefail

repository_root="$(git rev-parse --show-toplevel)"
cd "$repository_root"

case "${1:---staged}" in
  --staged)
    changed_files="$(git diff --cached --name-only --diff-filter=ACMR -- 'src/**/*.yaml')"
    ;;
  --range)
    if [ "$#" -ne 3 ]; then
      echo 'Usage: scripts/lint-visibility.sh --range <base-sha> <head-sha>' >&2
      exit 2
    fi
    changed_files="$(git diff --name-only --diff-filter=ACMR "$2" "$3" -- 'src/**/*.yaml')"
    ;;
  *)
    echo 'Usage: scripts/lint-visibility.sh [--staged | --range <base-sha> <head-sha>]' >&2
    exit 2
    ;;
esac

if [ -z "$changed_files" ]; then
  echo 'No changed OpenAPI source files to lint.'
  exit 0
fi

echo 'Checking explicit x-internal decisions in:'
echo "$changed_files"

X_INTERNAL_CHANGED_FILES="$changed_files" npx --yes @redocly/cli@2.19.0 lint \
  src/authorization/openapi.yaml \
  src/admin/openapi.yaml \
  src/spender/openapi.yaml \
  src/approver/openapi.yaml \
  src/hod/openapi.yaml \
  src/hop/openapi.yaml \
  src/common/openapi.yaml \
  src/accountant/openapi.yaml \
  src/super_admin/openapi.yaml \
  src/owner/openapi.yaml \
  src/manager/openapi.yaml \
  --config redocly.visibility.yaml
