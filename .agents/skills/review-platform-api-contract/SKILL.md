---
name: review-platform-api-contract
description: Review Fyle Platform API contract pull requests across runtime code, OpenAPI source and bundles, generated TypeScript, and consumers. Use for changes to endpoints, request or response schemas, requiredness, nullability, enums, or compatibility in fyle-platform-docs, fyle-platform-api, or fyle-platform-types. Produce evidence-backed findings and do not publish review comments unless explicitly asked.
---

# Review Platform API Contracts

Compare the proposed API contract change with runtime behavior, OpenAPI, and downstream types. Read [references/contract-chain.md](references/contract-chain.md) for repository-specific paths and commands.

## 1. Fix the review scope

- Record the PR base and head commits and the current API, docs, and types commits.
- Read the repository-local guidance files that exist, such as `AGENTS.md` or `CLAUDE.md`, and inspect each working-tree status.
- Preserve local changes. Use GitHub, `git show`, temporary copies, or a temporary worktree when a sibling repository is dirty.
- Inspect changed files, checks, reviews, and existing comments so findings are scoped and not duplicated.
- Triage changed source lines first. Prioritize `$ref`, requiredness, nullability, enums, shared schemas, and request/response shape changes; trace high-risk candidates through the full chain before expanding the review.

If a required repository is unavailable, continue only with supported conclusions and state the evidence gap.

## 2. Review source before generated output

- Treat `fyle-platform-docs/src/**` as source and `reference/*.yaml` as generated output.
- Map generated changes back to the exact source schema or path and attach findings there.
- Read the affected root document's OpenAPI version.
- Rebuild roles touched by supported candidates or suspected bundle drift.

## 3. Prove runtime behavior

Trace each changed field from the endpoint through the exact runtime path.

- For requests, inspect the loaded Marshmallow schema, validation, defaults, `post_load`, action logic, and request/error fixtures.
- For responses, inspect the handler's dump schema, serialization hooks, the object being dumped, models, current database views and constraints, relevant migrations, and response fixtures.
- For enums, compare OpenAPI with the runtime enum, validators, storage representation, fixtures, migrations, and history for removed values.

Use these contract rules:

- Marshmallow `required` primarily controls loading; it does not prove response-key presence.
- OpenAPI object-level `required` means the key is present. `nullable` means a present key may be `null`.
- Omitted and present-with-`null` are different contracts.
- In OpenAPI 3.0, schema keywords beside `$ref` do not extend the referenced schema. Use `allOf` only after runtime evidence proves the added constraint is correct.
- When input and output behavior differ, prefer separate request and response schemas over weakening the response contract.

Do not infer runtime behavior from the OpenAPI diff or a Marshmallow field flag alone.

## 4. Check generated types and consumers

- Compare base and proposed bundles in isolated directories in `fyle-platform-types`.
- Run the version classifier and generate representative before/after TypeScript when the contract shape changes.
- If dependencies are unavailable, inspect the relevant generator configuration and committed types, then mark generation and semver as unverified instead of installing into a sibling repository.
- Search identifiable consumers for affected imports, enum members, request arguments, optional fields, and null handling.
- Classify runtime compatibility, documentation accuracy, generated-source compatibility, and semver impact separately.

Do not call a change runtime-breaking only because a generated type breaks, or call it documentation-only when generated consumers need a migration.

## 5. Validate and report

Run the smallest relevant checks from the repository map. Report failures and skipped checks without hiding them.

Return findings in severity order. Each finding must include:

1. The exact changed source line; for docs changes, prefer `src/**` over `reference/**`.
2. The concrete contract mismatch and user or SDK impact.
3. Concise runtime and generated-type evidence.
4. A specific requested change and, when useful, a proposed inline comment.

Finish with the reviewed commits, checks run or skipped, evidence gaps, and publication status. Keep comments as proposals unless the user explicitly authorizes posting them.
