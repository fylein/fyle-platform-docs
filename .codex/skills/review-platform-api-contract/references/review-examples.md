# Contract reasoning examples

These examples were rebuilt from repository code and fixtures rather than existing PR comments. Re-verify them against the current branches before applying the conclusions to a new review.

The examples were checked on 2026-07-10 using docs base `91ca9356227a0329676a5221eb4b4bae46e2292a`, docs PR head `dbcba50944f4c55915763eaf4f1f0b0098b06f73` (source change `5880155519465a2b02c1dbd3e12bc7b850fcca66`), API `1c9a1fdea2c864abfe2631019ed5709a7c0cd4cc`, and types `fd490492bf19ecdb67ed93aa9c5ca5bd76c63b1b`.

## Contents

- [A. Request optionality is not response presence](#a-request-optionality-is-not-response-presence)
- [B. Effective nullability can still be wrong](#b-effective-nullability-can-still-be-wrong)
- [C. A runtime correction can break generated source](#c-a-runtime-correction-can-break-generated-source)

## A. Request optionality is not response presence

The level API demonstrates why one schema's Marshmallow load flags cannot define both sides of an HTTP contract.

Evidence:

- `fyle-platform-api/api/levels/schema.py` declares `id`, `band`, `code`, and `description` with `required=False`; `band`, `code`, and `description` allow `None`.
- `fyle-platform-api/api/levels/admin.py` uses that schema for both POST loading and GET dumping.
- `api/tests/admin/levels/002_test_post_insert/input.yaml` sends only `name` and `is_enabled`.
- The POST expected output and GET expected output contain `id`, `band`, `code`, and `description`; nullable values are present as `null`.

A valid request is therefore:

```json
{
  "name": "level 1",
  "is_enabled": true
}
```

The observed POST response is shaped like:

```json
{
  "id": "lvlf2yiY7usuX",
  "name": "level 1",
  "band": null,
  "code": null,
  "description": null,
  "is_enabled": true
}
```

Removing those properties from the output schema's object-level `required` array turns guaranteed response keys into optional generated properties. The representative difference is:

```ts
// Response contract supported by fixtures
type Level = {
  id: string;
  band: string | null;
};

// Contract produced when response requiredness mirrors request loading
type Level = {
  id?: string;
  band?: string | null;
};
```

General lesson: model request omission in an input schema and response presence in an output schema. A nullable response field can still be required to appear.

## B. Effective nullability can still be wrong

The spender personal-card `id` demonstrates the two separate questions in a nullability review: does the OpenAPI syntax apply, and can runtime return null?

The reviewed OpenAPI 3.0.3 change used:

```yaml
id:
  $ref: ./fields.yaml#/id_string
  nullable: true
```

In OpenAPI 3.0, `nullable` beside `$ref` does not extend the referenced Schema Object. Conforming tools may ignore it. This form makes the intent effective:

```yaml
id:
  allOf:
    - $ref: ./fields.yaml#/id_string
  nullable: true
```

That syntactic repair would still misrepresent the verified runtime:

- `api/personal_cards/spender.py` handles GET with `PersonalCardROVAPISchema` and explicitly dumps created cards with the same ROV API schema.
- `core/schema/personal_cards.py` defines the ROV `id` with `allow_none=False`.
- `db/models/personal_cards.py` maps `PersonalCard.id` and `PersonalCardROV.id` as primary keys.
- The original `platform_schema.personal_cards` migration defines `id` as a primary key, hence non-null.
- The current canonical `db-migrations/views/platform_schema/personal_cards_rov.sql` selects `pspc.id` through an inner join; it does not synthesize a nullable identifier.
- The later account-type migration changes only `account_type`; later RLS migrations change access policy, not ID nullability.
- Personal-card GET expected outputs contain string IDs.

The supported runtime shape is:

```json
{
  "id": "bacctW5DfRdoSW"
}
```

It is not:

```json
{
  "id": null
}
```

If the output object also omits `id` from object-level `required`, effective nullability can generate a type such as:

```ts
type PersonalCard = {
  id?: string | null;
};
```

General lesson: first prove that runtime can return `null`, then encode nullability using syntax supported by the affected OpenAPI version. Do not “fix” ignored syntax into an effective but false contract.

## C. A runtime correction can break generated source

The reviewed accounting-export-lineitem change corrects the documented `object_type` enum to the current API implementation.

Runtime evidence:

- `db/models/accounting_export_lineitems.py` defines `AccountExportLineitemObjectType` as `EXPENSE`, `REPORT`, `SETTLEMENT`, `REIMBURSEMENT`, `ADVANCE_REQUEST`, and `CCC_EXPENSE`.
- `api/accounting_export_lineitems/schema.py` validates request values with `EnumField(AccountExportLineitemObjectType)`.
- The canonical database snapshot stores `object_type` as a non-null string, so repository evidence does not rule out unknown legacy production strings by constraint alone.
- Migrations, function tests, and fixtures use current values such as `ADVANCE_REQUEST`, `EXPENSE`, `REPORT`, `REIMBURSEMENT`, and `CCC_EXPENSE`.
- Git history shows the Python enum with the same six values since the model entered its current location in 2022.

The docs change removes falsely documented response values such as `ADVANCE`, `BALANCE_TRANSFER`, and `REFUND`, and adds `CCC_EXPENSE`. Runtime is unchanged, but a representative generated union changes:

```ts
// Before
type ObjectType =
  | 'ADVANCE_REQUEST'
  | 'ADVANCE'
  | 'BALANCE_TRANSFER'
  | 'REFUND'
  | 'REIMBURSEMENT'
  | 'REPORT'
  | 'EXPENSE'
  | 'SETTLEMENT';

// After
type ObjectType =
  | 'ADVANCE_REQUEST'
  | 'CCC_EXPENSE'
  | 'EXPENSE'
  | 'REIMBURSEMENT'
  | 'REPORT'
  | 'SETTLEMENT';
```

Consumers referencing removed generated members can stop compiling even though the server never supported those values. Consumers using exhaustive response switches must also handle the newly documented `CCC_EXPENSE` value.

Under the current `fyle-platform-types` classifier, any breaking change reported by `oasdiff` yields `major`; otherwise a structural generated-type change yields at least `minor`. Run `pnpm run version:check` on isolated base and proposed specs to obtain the actual whole-PR result because direction matters for request versus response enums and other changes can raise the classification.

General lesson: classify runtime behavior and generated source compatibility separately. Call a change a documentation correction only for the server; it may still require an SDK migration and consumer updates.
