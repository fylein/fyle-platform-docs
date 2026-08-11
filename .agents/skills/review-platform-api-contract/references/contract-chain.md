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
```

Do not switch, pull, install into, or generate inside a dirty sibling. Use read-only evidence or an isolated worktree instead.

## Review and validate docs

`src/<role>/openapi.yaml` declares the document version, tags, security, and path references. Endpoint definitions live in `src/<role>/paths/`; shared schemas live in `src/components/schemas/`. Filenames use `@` for URL separators.

`reference/<role>.yaml` is generated. Use the repository's current Redocly version and run affected roles only:

```bash
openapi lint src/<role>/openapi.yaml
openapi bundle -o /tmp/<role>.yaml src/<role>/openapi.yaml
```

Compare the temporary bundle with `reference/<role>.yaml`. Inspect `.github/workflows/bundler.yml` when the role list or tool version matters.

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

Run the narrowest affected test group or test case using the commands in `fyle-platform-api/AGENTS.md` when runtime verification is needed.

## Compare generated types

Read `package.json` for the required Node and pnpm versions. The useful entry points are:

```bash
pnpm test
OLD_SPECS_DIR=<base-specs> NEW_SPECS_DIR=<head-specs> pnpm run version:check
OPENAPI_SPECS_DIR=<specs> OPENAPI_OUTPUT_DIR=<output> pnpm exec openapi-ts
```

Use temporary base/head spec and output directories. `pnpm run build` syncs local docs into the types worktree, so run it only in an isolated worktree.

The classifier's highest result wins:

- `major`: `oasdiff breaking` reports a breaking OpenAPI change or a role disappears.
- `minor`: generated structure changes without an OpenAPI breaking result, or a role appears.
- `patch`: only generated documentation changes.
- `none`: no generated or documentation change.

## Find consumers

`TYPES_CONSUMER_REPOS` is a GitHub repository variable and is not enumerated in source. Search available sibling repositories instead:

```bash
rg -l '"@fylein/types"' ../*/package.json
rg '<affected-generated-symbol>' ../<consumer> -g '*.ts' -g '*.tsx' -g '!**/node_modules/**'
```

Inspect only consumers that use affected generated symbols. State that the search is incomplete when private or unavailable consumers may exist.
