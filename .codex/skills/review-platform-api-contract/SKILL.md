---
name: review-platform-api-contract
description: Review Fyle Platform API pull requests and OpenAPI contract changes across fyle-platform-api, fyle-platform-docs source and generated references, fyle-platform-types generated TypeScript, and external or internal consumers. Use for PR review, runtime-versus-documentation comparison, backward-compatibility analysis, requiredness, nullability, enums, response shapes, OpenAPI 3.0 semantics, generated SDK impact, version classification, or evidence-backed GitHub review comments.
---

# Review Platform API Contracts

Review the entire runtime-to-consumer contract chain. Treat repository evidence as authoritative, distinguish request validation from response serialization, and return proposed comments by default.

## Load the references

Read [references/contract-chain.md](references/contract-chain.md) for every review. Read [references/review-examples.md](references/review-examples.md) when the change involves requiredness, nullability, enums, generated types, or ambiguous runtime behavior. Rebuild conclusions from current code; use the examples as reasoning patterns, not canned findings.

## 1. Establish immutable review inputs

1. Locate `fyle-platform-api`, `fyle-platform-docs`, and `fyle-platform-types`, normally as sibling repositories. Search nearby directories or ask for a clone/path when one is missing; do not silently omit a link in the chain.
2. Read each repository's `AGENTS.md` and relevant local instructions before acting.
3. Run `git status --short --branch` in every repository. Preserve dirty worktrees and all user changes. Do not refresh, switch, generate into, or install dependencies in a dirty sibling.
4. Resolve each default branch from `refs/remotes/origin/HEAD`; do not assume all repositories use `main`. Fetch or pull only clean worktrees. Prefer remote API evidence or a temporary worktree when refresh is unsafe.
5. Fetch the PR metadata, base and head commits, changed files, checks, reviews, conversations, and inline comments. Record exact docs, API, and types commits used. Avoid repeating an existing finding.
6. Keep the review read-only. Never post a comment, submit a review, approve, or request changes without explicit user authorization for that publication action.

If current remote state is unavailable, state which local refs and timestamps were used and mark conclusions that may be stale.

## 2. Separate source from generated output

Treat `fyle-platform-docs/src/**` as the review source and `reference/*.yaml` as generated bundles.

1. Map each changed reference fragment back to its `src/**` schema or path.
2. Comment on the exact changed source line. Do not duplicate the same finding on a generated reference file.
3. Read the affected root document's `openapi` version.
4. Run the repository's current lint and bundle commands for each affected role when feasible.
5. Compare regenerated output with the PR's `reference/*.yaml`. Report missing, stale, or unrelated generated changes separately.

## 3. Prove request behavior

Trace each changed request property from the endpoint to the loaded Marshmallow schema and action:

- Inspect `required`, `allow_none`, `load_only`, defaults, missing-value behavior, validators, and unknown-field handling.
- Inspect `post_load` conversion and action validation.
- Inspect validation-error fixtures and successful request tests.
- Distinguish omission from an explicit `null`.

Do not infer runtime request behavior from an OpenAPI diff alone.

## 4. Prove response behavior

Trace each changed response property through the handler and the exact schema used for dumping. Do not treat Marshmallow `required=True` or `required=False` as response-presence evidence by itself.

Inspect, as applicable:

- `dump_only` fields, serialization hooks, computed fields, and the object passed to `dump`.
- SQLAlchemy models and current database constraints.
- The current canonical SQL view and every later migration that touches the table or view.
- Join types that can introduce, exclude, or preserve nulls.
- GET, POST, bulk, and action response fixtures or expected-output files.

Apply these contract meanings precisely:

- Marshmallow `required=False` generally permits omission while loading a request.
- OpenAPI object-level `required` means the response key is present.
- OpenAPI `nullable: true` means the present key may contain `null`.
- Optional/missing and present-with-null are different contracts.

When request and response shapes differ, require separate input and output schemas instead of weakening a response to mirror request optionality.

## 5. Verify enums and OpenAPI semantics

For an enum change:

1. Compare the documented values with the current Python enum and schema validation.
2. Inspect the database column or constraint and stored-value representation.
3. Search migrations, fixtures, and git history for removed values and legacy support.
4. Distinguish a falsely documented value from a historically supported or persisted value.
5. Explain both runtime compatibility and generated TypeScript source compatibility.

For OpenAPI 3.0.x, treat a Reference Object as non-extensible: schema keywords placed beside `$ref` are ignored by conforming tooling. Use `allOf` when a referenced schema genuinely needs extension. First prove the runtime contract; making `nullable` effective with `allOf` can still document the wrong behavior.

## 6. Evaluate generated types and consumers

Use `fyle-platform-types` as the downstream SDK representation.

1. Confirm that `specs/*.yaml` sync from `fyle-platform-docs/reference/*.yaml` and inspect `openapi-ts.config.ts`, sync scripts, version-classification scripts, and CI.
2. Use the Node and pnpm versions declared by that repository.
3. Preserve its worktree. Compare in a temporary worktree or with temporary copies of old and proposed specs.
4. Run the relevant existing commands when feasible: `pnpm test`, `pnpm run build`, and `pnpm run version:check`.
5. Compare generated TypeScript before and after. Quote only representative types or signatures; do not dump the generated tree.
6. Inspect dispatched consumer repositories when they are identifiable. Search for removed enum members, newly required arguments, optional response properties, and new null checks.

Classify every impact independently:

- Runtime API breaking change.
- Request-validation correction.
- Response-contract change.
- Generated SDK compile/source break.
- Documentation-only change.
- Non-breaking contract expansion.

State uncertainty when repository evidence cannot prove production legacy data or every consumer.

## 7. Return actionable findings

Order findings by severity. For each finding, provide:

1. Category and exact `src/**` line.
2. Concrete contract problem.
3. Runtime and customer or SDK impact.
4. Concise evidence from the implementation, database/view, fixtures, and generated types.
5. A clear requested change.
6. A proposed inline comment when useful.

Attach proposed comments to source lines, not generated references. Link relevant API or types files. When the user requests latest-default-branch links, link that branch and separately record the verified commit for reproducibility. Use a small before/after example only when it clarifies the contract.

Avoid vague claims such as “this may break something.” If evidence is incomplete, name the missing evidence and narrow the claim.

Finish with the verified commits, commands run, checks not run, assumptions, and publication status. Return proposed comments to the user unless the user explicitly authorizes posting them.
