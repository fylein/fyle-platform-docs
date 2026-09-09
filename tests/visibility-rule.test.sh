#!/usr/bin/env bash

set -euo pipefail

repository_root="$(git rev-parse --show-toplevel)"
cd "$repository_root"

redocly=(npx --yes @redocly/cli@2.51.2 lint --config redocly.visibility.yaml)

"${redocly[@]}" tests/visibility/valid.yaml

if "${redocly[@]}" tests/visibility/invalid.yaml; then
  echo 'Expected the invalid visibility fixture to fail.' >&2
  exit 1
fi
