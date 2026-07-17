# Platform API contract chain

Use this map to find evidence and execute the current repository workflow. Re-verify commands, versions, and default branches because they can change.

## Contents

- [Verified repository map](#verified-repository-map)
- [Establish PR and repository state](#establish-pr-and-repository-state)
- [Docs source and bundles](#docs-source-and-bundles)
- [Runtime evidence map](#runtime-evidence-map)
- [OpenAPI 3.0 contract rules](#openapi-30-contract-rules)
- [Types sync and classification](#types-sync-and-classification)
- [Review comment template](#review-comment-template)

## Verified repository map

Verified on 2026-07-10 from these local default-branch commits:

| Repository | Default branch | Verified commit | Contract role |
| --- | --- | --- | --- |
| `fyle-platform-api` | `master` | `1c9a1fdea2c864abfe2631019ed5709a7c0cd4cc` | Runtime handlers, validation, models, views, migrations, and fixtures |
| `fyle-platform-docs` | `main` | `91ca9356227a0329676a5221eb4b4bae46e2292a` | Modular OpenAPI source and bundled references |
| `fyle-platform-types` | `master` | `fd490492bf19ecdb67ed93aa9c5ca5bd76c63b1b` | Synced specs, generated TypeScript, and version classification |

Resolve the branch again with `git symbolic-ref --short refs/remotes/origin/HEAD`. Record both the branch and commit used by the review.

The flow is:

```text
fyle-platform-api runtime evidence
  -> manually maintained fyle-platform-docs/src
  -> Redocly bundles in fyle-platform-docs/reference
  -> fyle-platform-types/specs sync
  -> @hey-api/openapi-ts output and @fylein/types
  -> configured internal consumers and external API/SDK users
```

The API does not generate the docs automatically. A docs-only change can leave runtime behavior unchanged while changing generated SDK types.

## Establish PR and repository state

Use GitHub tooling to collect the PR base/head SHAs, changed files, check rollup, reviews, issue comments, and inline review comments. Include pagination when calling the API directly. Compare the proposed finding with existing conversations before drafting it.

Run these safe local checks in all three repositories:

```bash
git status --short --branch
git symbolic-ref --short refs/remotes/origin/HEAD
git log -1 --format='%H %cI %s'
```

Do not refresh a dirty repository. If a sibling is missing:

1. Search the parent and configured workspace roots by repository name.
2. Ask for the existing clone path before creating another clone.
3. If cloning is authorized, clone beside the other repositories and record its default branch and commit.
4. If evidence remains unavailable, complete only the supported parts and label the gap.

## Docs source and bundles

`src/<role>/openapi.yaml` declares the document version, tags, security, and path references. Endpoint definitions live in `src/<role>/paths/`; shared schemas live in `src/components/schemas/`. Filenames use `@` for URL separators.

`reference/<role>.yaml` is generated. The bundler workflow currently installs `@redocly/cli@2.19.0` on Node 22 and runs this pattern:

```bash
openapi lint src/<role>/openapi.yaml
openapi bundle -o reference/<role>.yaml src/<role>/openapi.yaml
```

The workflow bundles `authorization`, `spender`, `approver`, `common`, `admin`, `hod`, `hop`, `accountant`, `super_admin`, `owner`, and `manager`. Inspect `.github/workflows/bundler.yml` and `README.md` rather than assuming the list remains current.

Review `src/**` first. Use the bundled diff to verify generation, resolve downstream type input, and spot stale output. Never place duplicate review comments on `reference/*.yaml` when the source line is available.

## Runtime evidence map

Start from the route and follow the actual load or dump path.

For request behavior, inspect:

- `api/<resource>/<role>.py` or the relevant blueprint and view.
- `api/<resource>/schema.py` and inherited `core/schema/**` fields.
- `required`, `allow_none`, `load_only`, defaults, missing handling, validators, and `post_load`.
- The action class and model validation.
- `api/tests/**/input.yaml`, validation-error expected output, and successful tests.

For response behavior, inspect:

- The handler's exact `get_schema` or explicit `Schema().dump(...)` call.
- `dump_only` overrides, serialization hooks, computed values, and inheritance.
- `db/models/**` column definitions.
- `db-migrations/views/**` as the canonical current view.
- The original table migration and every later migration or view rewrite touching the field.
- Join direction and nullability of joined columns.
- `api/tests/**/expected_output.yaml` for each relevant endpoint/action.

Git history helps distinguish current truth from an outdated migration or formerly supported value:

```bash
git log --all -- <path>
git log -p -G '<field-or-enum>' --all -- <relevant-paths>
```

Do not use an old table definition alone when a later migration added constraints. Do not use Marshmallow load semantics alone to infer a dumped response key.

## OpenAPI 3.0 contract rules

Read the root document's version before applying version-specific rules. The current role documents use OpenAPI 3.0.3.

For 3.0.x:

- A Reference Object contains `$ref`; sibling schema keywords do not extend the target for conforming tooling.
- Wrap a reference in `allOf` to apply schema keywords, for example:

```yaml
id:
  allOf:
    - $ref: ./fields.yaml#/id_string
  nullable: true
```

- Do not make this rewrite until runtime evidence proves `null` is a valid value.
- Object-level `required` controls key presence. `nullable` controls whether a present value may be `null`.

## Types sync and classification

`fyle-platform-types/scripts/sync-specs.sh` copies these docs bundles into `specs/` in local mode and fetches them from the docs `main` branch in remote mode. It currently syncs 11 roles.

`openapi-ts.config.ts` reads `specs/*.yaml` and generates per-role TypeScript with `@hey-api/openapi-ts`. The current repository declares Node `24.12.0` and pnpm `10.33.0`; take the exact values from `package.json` and the package-manager files at review time.

Relevant commands are:

```bash
pnpm test
pnpm run build
pnpm run version:check
```

Do not run local `build` in the user's types worktree during a PR comparison because its sync step copies the current sibling docs bundles. Instead, use a temporary types worktree or temporary old/new spec directories, point `OLD_SPECS_DIR` and `NEW_SPECS_DIR` at them, and preserve the original worktree.

The current version classifier applies the highest result:

- `major`: `oasdiff breaking` reports a breaking OpenAPI change or a role disappears.
- `minor`: structural generated TypeScript changes without a breaking diff, or a role is added.
- `patch`: only generated comments/documentation change.
- `none`: no generated or documentation change.

Inspect `scripts/determine-version-bump.js`, its core module and tests, `.github/workflows/sync-spec-and-validate.yml`, and `openapi-ts.config.ts`. The workflow builds generated types after classification and can dispatch a `types-updated` event to repositories configured in `TYPES_CONSUMER_REPOS`; the repository does not enumerate those consumers in source.

When evaluating a PR, copy the base bundles and proposed bundles into separate temporary spec directories. Compare representative generated aliases and operation inputs. A version result does not replace the semantic review: a falsely documented enum correction may be runtime-safe while still breaking source code compiled against generated types.

## Review comment template

Use this shape, omitting sections that add no value:

```markdown
This makes `<specific generated/runtime contract>` even though `<verified runtime fact>`.

- Runtime: `<handler/schema/model/view/fixture evidence>`
- SDK: `<representative before/after type or call signature>`
- Verified at: `<implementation and types commit>`

Please `<concrete requested change>`.
```

Attach the comment to the exact changed `src/**` line. Link default-branch files when requested, but retain verified commit SHAs in the review summary.
