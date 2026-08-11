# Platform API contract chain

The repositories normally live beside one another:

| Repository | Contract role |
| --- | --- |
| `fyle-platform-api` | Runtime handlers, schemas, models, database views, migrations, and fixtures |
| `fyle-platform-docs` | OpenAPI source in `src/` and generated bundles in `reference/` |
| `fyle-platform-types` | Synced bundles, generated TypeScript, and semver classification |
| `fyle-app` | Known direct consumer of `@fylein/types`; do not assume it is the only consumer |

Resolve default branches and commits at review time. The contract flow is:

```text
fyle-platform-api runtime
  -> fyle-platform-docs/src
  -> fyle-platform-docs/reference
  -> fyle-platform-types/specs
  -> @fylein/types
  -> consumers
```

## Record repository state

```bash
git status --short --branch
git symbolic-ref --short refs/remotes/origin/HEAD
git log -1 --format='%H %cI %s'
gh pr view <number> --json baseRefOid,headRefOid,state,url
```

The PR base branch may advance after the PR opens. Resolve both PR refs, then use their merge base for the reviewed diff. For runtime evidence, use a linked `fyle-platform-api` PR or commit when one exists. Otherwise, an exact default-branch commit can prove only current behavior. A checked-out branch, similar timestamp, or current file is not evidence for a historical PR unless its commit is the selected revision.

Record the evidence role beside every commit: proposed change, current behavior, or historical context. Read files with `git show <commit>:<path>` or from an isolated worktree so paths from different revisions are not mixed.

Do not switch, pull, install into, or generate inside a dirty sibling. Use read-only evidence or an isolated worktree instead.

## Review and validate docs

`src/<role>/openapi.yaml` declares the document version, tags, security, and path references. Endpoint definitions live in `src/<role>/paths/`; shared schemas live in `src/components/schemas/`. Filenames use `@` for URL separators.

Inventory a docs diff before tracing it:

```bash
python3 <skill-dir>/scripts/contract_diff_inventory.py \
  --repo <fyle-platform-docs> --base <base-ref> --head <head-ref>
```

The script resolves immutable commits, computes the merge base, counts changed source files and risk-marker lines, discovers role roots from `src/*/openapi.yaml`, and selects bulk mode for more than 10 source files or more than 3 directly changed roles. Use `--format json` when file-level details are needed.

`reference/<role>.yaml` is generated. Read the pinned Redocly version from `.github/workflows/bundler.yml` at the reviewed revision and verify its bundle steps cover every discovered role root. Lint and bundle every role reported by the inventory:

```bash
openapi lint src/<role>/openapi.yaml
openapi bundle -o /tmp/<role>.yaml src/<role>/openapi.yaml
```

Compare temporary base and head bundles with their corresponding committed `reference/<role>.yaml` files, then compare base with head. A shared `src/components/**` change requires all role roots because shared-schema fan-out is not reliably visible from changed paths alone.

## Trace runtime behavior

Start from the route and inspect only the evidence needed for the changed field:

- `api/<resource>/<role>.py` or the relevant blueprint and view.
- `api/<resource>/schema.py` and inherited `core/schema/**` fields.
- The action class and model validation for writes.
- `db/models/**` column definitions.
- Current `db-migrations/views/**` plus migrations that changed the field or view.
- `api/tests/**/input.yaml` and `expected_output.yaml` for successful and validation-error cases.

Use history when removed enum values or legacy storage are relevant:

```bash
git log -p -G '<field-or-enum>' --all -- <relevant-paths>
```

Run the narrowest affected test group or test case using the commands in `fyle-platform-api/CLAUDE.md` when runtime verification is needed.

## Compare generated types

Read `package.json` for the required Node and pnpm versions. The useful entry points are:

```bash
pnpm test
OLD_SPECS_DIR=<base-specs> NEW_SPECS_DIR=<head-specs> pnpm run version:check
OPENAPI_SPECS_DIR=<specs> OPENAPI_OUTPUT_DIR=<output> pnpm exec openapi-ts
```

Use temporary base/head spec and output directories. `pnpm run build` syncs local docs into the types worktree, so run it only in an isolated worktree.

`dist/` and `.generated/` are ignored rather than committed. If generation dependencies cannot run, compare the input specs and generator configuration, state that generated TypeScript and semver are unverified, and stop short of claiming full-chain validation.

The classifier's highest result wins:

- `major`: `oasdiff breaking` reports a breaking OpenAPI change or a role disappears.
- `minor`: generated structure changes without an OpenAPI breaking result, or a role appears.
- `patch`: only generated documentation changes.
- `none`: no generated or documentation change.

## Account for broad changes

For bulk mode, keep a coverage manifest with these denominators:

- changed `src/**` files reviewed;
- risk-marker lines triaged and resulting candidates traced to runtime evidence;
- bundle roles linted and regenerated;
- generated roles compared when shape changes;
- affected symbols checked in every known available consumer.

Report each as `reviewed/total` and name the deterministic check used for grouped mechanical edits. Do not describe a sampled review as exhaustive; list any uncovered files, roles, or consumers as evidence gaps.

## Find consumers

`TYPES_CONSUMER_REPOS` is a GitHub repository variable and is not enumerated in source. Search available sibling repositories instead:

```bash
rg -l '"@fylein/types"\s*:' .. -g 'package.json' -g '!**/node_modules/**' -g '!**/.pnpm-store/**'
rg '<affected-generated-symbol>' ../<consumer> -g '*.ts' -g '*.tsx' -g '!**/node_modules/**'
```

Inspect only consumers that use affected generated symbols. State that the search is incomplete when private or unavailable consumers may exist.
