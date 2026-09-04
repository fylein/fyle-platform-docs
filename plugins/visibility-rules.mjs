function normalizePath(path) {
  return path.replaceAll('\\', '/');
}

function getChangedFiles() {
  if (!Object.prototype.hasOwnProperty.call(process.env, 'X_INTERNAL_CHANGED_FILES')) {
    return null;
  }

  return new Set(
    process.env.X_INTERNAL_CHANGED_FILES.split(/\r?\n/)
      .map((path) => normalizePath(path.trim()))
      .filter(Boolean),
  );
}

function isOperationInScope(ctx, changedFiles) {
  if (changedFiles === null) {
    return true;
  }

  const sourcePath = normalizePath(
    ctx.location?.source?.absoluteRef ?? ctx.location?.source?.ref ?? '',
  );

  return [...changedFiles].some(
    (changedFile) =>
      sourcePath === changedFile || sourcePath.endsWith(`/${changedFile}`),
  );
}

function operationXInternalRule() {
  const changedFiles = getChangedFiles();

  return {
    Operation: {
      enter(operation, ctx) {
        if (!isOperationInScope(ctx, changedFiles)) {
          return;
        }

        if (!Object.prototype.hasOwnProperty.call(operation, 'x-internal')) {
          ctx.report({
            message:
              'Every operation must explicitly set x-internal to true or false.',
          });
          return;
        }

        if (typeof operation['x-internal'] !== 'boolean') {
          ctx.report({
            message: 'x-internal must be a boolean.',
            location: ctx.location.child('x-internal'),
          });
        }
      },
    },
  };
}

export default function visibilityRulesPlugin() {
  return {
    id: 'visibility',
    rules: {
      oas3: {
        'operation-x-internal': operationXInternalRule,
      },
    },
  };
}
