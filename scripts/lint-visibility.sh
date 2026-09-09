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

changed_path_files=()
while IFS= read -r changed_file; do
  case "$changed_file" in
    src/*/paths/*.yaml)
      changed_path_files+=("$changed_file")
      ;;
  esac
done <<< "$changed_files"

if [ "${#changed_path_files[@]}" -eq 0 ]; then
  echo 'No changed OpenAPI path files to lint.'
  exit 0
fi

echo 'Checking explicit x-internal decisions in:'
printf '%s\n' "${changed_path_files[@]}"

lint_root="$(mktemp "${TMPDIR:-/tmp}/visibility-lint.yaml.XXXXXX")"
trap 'rm -f "$lint_root"' EXIT

{
  printf '%s\n' 'openapi: 3.0.3'
  printf '%s\n' 'info:'
  printf '%s\n' '  title: Changed operation visibility lint'
  printf '%s\n' '  version: 1.0.0'
  printf '%s\n' 'paths:'

  path_index=0
  for changed_file in "${changed_path_files[@]}"; do
    printf '  /visibility-lint-%d:\n' "$path_index"
    printf '    $ref: '
    printf "'%s/%s'\n" "$repository_root" "$changed_file"
    path_index=$((path_index + 1))
  done
} > "$lint_root"

npx --yes @redocly/cli@2.51.2 lint "$lint_root" \
  --config redocly.visibility.yaml
