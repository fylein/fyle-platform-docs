import assert from 'node:assert/strict';
import test from 'node:test';

import visibilityRulesPlugin from '../plugins/visibility-rules.mjs';

function runRule(operation, sourcePath = '/repo/src/admin/paths/example.yaml') {
  const reports = [];
  const location = {
    source: { absoluteRef: sourcePath },
    child: (property) => ({ source: { absoluteRef: sourcePath }, property }),
  };
  const rule =
    visibilityRulesPlugin().rules.oas3['operation-x-internal']();

  rule.Operation.enter(operation, {
    location,
    report: (problem) => reports.push(problem),
  });

  return reports;
}

test('accepts explicit boolean visibility decisions', () => {
  delete process.env.X_INTERNAL_CHANGED_FILES;

  assert.deepEqual(runRule({ 'x-internal': true }), []);
  assert.deepEqual(runRule({ 'x-internal': false }), []);
});

test('rejects a missing visibility decision', () => {
  delete process.env.X_INTERNAL_CHANGED_FILES;

  assert.equal(runRule({}).length, 1);
  assert.match(runRule({})[0].message, /explicitly set x-internal/);
});

test('rejects a non-boolean visibility decision', () => {
  delete process.env.X_INTERNAL_CHANGED_FILES;

  const reports = runRule({ 'x-internal': 'false' });

  assert.equal(reports.length, 1);
  assert.equal(reports[0].message, 'x-internal must be a boolean.');
});

test('checks only files selected by the pull request workflow', () => {
  process.env.X_INTERNAL_CHANGED_FILES = 'src/admin/paths/changed.yaml';

  assert.equal(
    runRule({}, '/repo/src/admin/paths/changed.yaml').length,
    1,
  );
  assert.deepEqual(runRule({}, '/repo/src/admin/paths/unchanged.yaml'), []);

  delete process.env.X_INTERNAL_CHANGED_FILES;
});
