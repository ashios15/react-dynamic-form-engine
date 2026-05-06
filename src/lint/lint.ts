import type { FormConfig, StepConfig, FieldConfig, ConditionalRule, FieldType } from '../types';

// ─── Public types ───────────────────────────────────────────────────────────

export type LintSeverity = 'error' | 'warning';

export type LintRuleId =
  | 'duplicate-field-name'
  | 'duplicate-step-id'
  | 'empty-steps'
  | 'empty-step-fields'
  | 'condition-unknown-field'
  | 'condition-self-reference'
  | 'condition-forward-reference'
  | 'condition-operator-type-mismatch'
  | 'condition-in-non-array-value'
  | 'required-hidden-by-own-condition'
  | 'select-without-options'
  | 'options-on-non-choice-field'
  | 'duplicate-option-value'
  | 'validation-type-mismatch'
  | 'custom-without-render'
  | 'invalid-col-span';

export interface LintLocation {
  path: string;
  stepIndex?: number;
  field?: string;
}

export interface LintIssue {
  rule: LintRuleId;
  severity: LintSeverity;
  message: string;
  location: LintLocation;
}

export interface LintReport {
  ok: boolean;
  errors: number;
  warnings: number;
  issues: LintIssue[];
}

// ─── Internal tables ────────────────────────────────────────────────────────

const CHOICE_FIELDS: ReadonlySet<FieldType> = new Set<FieldType>(['select', 'radio']);
const NUMERIC_OPERATORS: ReadonlySet<ConditionalRule['operator']> = new Set(['gt', 'lt']);
const STRING_OPERATORS: ReadonlySet<ConditionalRule['operator']> = new Set(['contains']);
const NUMERIC_FIELD_TYPES: ReadonlySet<FieldType> = new Set<FieldType>(['number']);
const STRING_FIELD_TYPES: ReadonlySet<FieldType> = new Set<FieldType>([
  'text', 'email', 'password', 'textarea', 'date',
]);

function inferZodKind(schema: unknown): string | undefined {
  if (!schema || typeof schema !== 'object') return undefined;
  const def = (schema as { _def?: { typeName?: string } })._def;
  return typeof def?.typeName === 'string' ? def.typeName : undefined;
}

function zodKindMatchesFieldType(zodKind: string, type: FieldType): boolean {
  switch (zodKind) {
    case 'ZodString':
      return STRING_FIELD_TYPES.has(type) || type === 'select' || type === 'radio';
    case 'ZodNumber':
      return NUMERIC_FIELD_TYPES.has(type);
    case 'ZodBoolean':
      return type === 'checkbox';
    case 'ZodDate':
      return type === 'date';
    case 'ZodArray':
      return type === 'checkbox' || type === 'select' || type === 'file';
    case 'ZodObject':
    case 'ZodRecord':
    case 'ZodTuple':
      return type === 'custom';
    default:
      return true;
  }
}

export function lint(config: FormConfig): LintReport {
  const issues: LintIssue[] = [];
  const push = (rule: LintRuleId, severity: LintSeverity, message: string, location: LintLocation) => {
    issues.push({ rule, severity, message, location });
  };

  if (!Array.isArray(config.steps) || config.steps.length === 0) {
    push('empty-steps', 'error', 'Config has no steps.', { path: 'steps' });
    return finalize(issues);
  }

  const stepIds = new Set<string>();
  const fieldNameToStep = new Map<string, number>();

  for (let stepIndex = 0; stepIndex < config.steps.length; stepIndex++) {
    const step = config.steps[stepIndex]!;
    lintStep(step, stepIndex, stepIds, fieldNameToStep, push);
  }

  lintCrossReferences(config, fieldNameToStep, push);
  return finalize(issues);
}

function lintStep(
  step: StepConfig,
  stepIndex: number,
  stepIds: Set<string>,
  fieldNameToStep: Map<string, number>,
  push: (r: LintRuleId, s: LintSeverity, m: string, l: LintLocation) => void
) {
  const stepPath = `steps[${stepIndex}]`;

  if (stepIds.has(step.id)) {
    push('duplicate-step-id', 'error', `Duplicate step id "${step.id}".`, { path: `${stepPath}.id`, stepIndex });
  }
  stepIds.add(step.id);

  if (!Array.isArray(step.fields) || step.fields.length === 0) {
    push('empty-step-fields', 'warning', `Step "${step.id}" has no fields.`, { path: `${stepPath}.fields`, stepIndex });
    return;
  }

  const namesInThisStep = new Set<string>();
  for (let fieldIndex = 0; fieldIndex < step.fields.length; fieldIndex++) {
    const field = step.fields[fieldIndex]!;
    lintField(field, stepIndex, fieldIndex, namesInThisStep, fieldNameToStep, push);
  }
  for (const name of namesInThisStep) {
    if (!fieldNameToStep.has(name)) fieldNameToStep.set(name, stepIndex);
  }
}

function lintField(
  field: FieldConfig,
  stepIndex: number,
  fieldIndex: number,
  namesInThisStep: Set<string>,
  fieldNameToStep: Map<string, number>,
  push: (r: LintRuleId, s: LintSeverity, m: string, l: LintLocation) => void
) {
  const fieldPath = `steps[${stepIndex}].fields[${fieldIndex}]`;
  const loc = (path: string): LintLocation => ({ path, stepIndex, field: field.name });

  if (fieldNameToStep.has(field.name) || namesInThisStep.has(field.name)) {
    push('duplicate-field-name', 'error', `Field name "${field.name}" is used more than once.`, loc(`${fieldPath}.name`));
  }
  namesInThisStep.add(field.name);

  if (CHOICE_FIELDS.has(field.type)) {
    if (!field.options || field.options.length === 0) {
      push('select-without-options', 'error', `Field "${field.name}" has type "${field.type}" but no options.`, loc(`${fieldPath}.options`));
    } else {
      const seen = new Set<string>();
      for (const option of field.options) {
        if (seen.has(option.value)) {
          push('duplicate-option-value', 'error', `Field "${field.name}" has duplicate option value "${option.value}".`, loc(`${fieldPath}.options`));
        }
        seen.add(option.value);
      }
    }
  } else if (field.options && field.options.length > 0) {
    push('options-on-non-choice-field', 'warning', `Field "${field.name}" (type "${field.type}") has options that will be ignored.`, loc(`${fieldPath}.options`));
  }

  if (field.type === 'custom' && typeof field.render !== 'function') {
    push('custom-without-render', 'error', `Field "${field.name}" has type "custom" but no render function.`, loc(`${fieldPath}.render`));
  }

  if (field.colSpan !== undefined) {
    if (!Number.isInteger(field.colSpan) || field.colSpan < 1 || field.colSpan > 12) {
      push('invalid-col-span', 'error', `Field "${field.name}" has colSpan ${field.colSpan}; must be an integer in [1, 12].`, loc(`${fieldPath}.colSpan`));
    }
  }

  const zodKind = inferZodKind(field.validation);
  if (zodKind && !zodKindMatchesFieldType(zodKind, field.type)) {
    push('validation-type-mismatch', 'warning', `Field "${field.name}" is type "${field.type}" but its Zod validator looks like "${zodKind}".`, loc(`${fieldPath}.validation`));
  }

  const conditions = field.conditions ?? [];
  for (let conditionIndex = 0; conditionIndex < conditions.length; conditionIndex++) {
    const condition = conditions[conditionIndex]!;
    const conditionPath = `${fieldPath}.conditions[${conditionIndex}]`;

    if (condition.when === field.name) {
      push('condition-self-reference', 'error', `Field "${field.name}" has a condition that watches itself.`, loc(conditionPath));
    }
    if (condition.operator === 'in' && !Array.isArray(condition.value)) {
      push('condition-in-non-array-value', 'error', `Condition on "${field.name}" uses operator "in" but value is not an array.`, loc(`${conditionPath}.value`));
    }
  }

  if (field.required && conditions.length > 0) {
    push('required-hidden-by-own-condition', 'warning', `Field "${field.name}" is required but hidden by conditions — validation only runs when visible. Confirm this is intentional.`, loc(fieldPath));
  }
}

function lintCrossReferences(
  config: FormConfig,
  fieldNameToStep: Map<string, number>,
  push: (r: LintRuleId, s: LintSeverity, m: string, l: LintLocation) => void
) {
  const allNames = new Set(fieldNameToStep.keys());

  for (let stepIndex = 0; stepIndex < config.steps.length; stepIndex++) {
    const step = config.steps[stepIndex]!;
    for (let fieldIndex = 0; fieldIndex < step.fields.length; fieldIndex++) {
      const field = step.fields[fieldIndex]!;
      const conditions = field.conditions ?? [];
      for (let conditionIndex = 0; conditionIndex < conditions.length; conditionIndex++) {
        const condition = conditions[conditionIndex]!;
        const conditionPath = `steps[${stepIndex}].fields[${fieldIndex}].conditions[${conditionIndex}]`;
        const loc: LintLocation = { path: conditionPath, stepIndex, field: field.name };

        if (condition.when === field.name) continue;

        if (!allNames.has(condition.when)) {
          push('condition-unknown-field', 'error', `Field "${field.name}" has a condition watching "${condition.when}", which does not exist in any step.`, { ...loc, path: `${conditionPath}.when` });
          continue;
        }

        const watchedStep = fieldNameToStep.get(condition.when);
        if (watchedStep !== undefined && watchedStep > stepIndex) {
          push('condition-forward-reference', 'warning', `Field "${field.name}" in step ${stepIndex} depends on "${condition.when}" from later step ${watchedStep}; its value will be undefined until that step runs.`, loc);
        }

        const watchedField = watchedStep !== undefined
          ? config.steps[watchedStep]?.fields.find((f) => f.name === condition.when)
          : undefined;
        if (watchedField) {
          if (NUMERIC_OPERATORS.has(condition.operator) && !NUMERIC_FIELD_TYPES.has(watchedField.type)) {
            push('condition-operator-type-mismatch', 'warning', `Condition on "${field.name}" uses numeric operator "${condition.operator}" against non-numeric field "${watchedField.name}" (type "${watchedField.type}").`, loc);
          }
          if (STRING_OPERATORS.has(condition.operator) && !STRING_FIELD_TYPES.has(watchedField.type) && watchedField.type !== 'select' && watchedField.type !== 'radio') {
            push('condition-operator-type-mismatch', 'warning', `Condition on "${field.name}" uses operator "${condition.operator}" against field "${watchedField.name}" (type "${watchedField.type}"), which may not be a string.`, loc);
          }
        }
      }
    }
  }
}

function finalize(issues: LintIssue[]): LintReport {
  let errors = 0;
  let warnings = 0;
  for (const issue of issues) {
    if (issue.severity === 'error') errors++;
    else warnings++;
  }
  return { ok: errors === 0, errors, warnings, issues };
}

export function formatReport(report: LintReport): string {
  if (report.issues.length === 0) return '\u2713 No issues found.\n';

  const lines: string[] = [
    `Found ${report.errors} error${report.errors === 1 ? '' : 's'} and ${report.warnings} warning${report.warnings === 1 ? '' : 's'}.`,
    '',
  ];
  const sorted = [...report.issues].sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
    return a.location.path.localeCompare(b.location.path);
  });
  for (const issue of sorted) {
    const tag = issue.severity === 'error' ? 'ERROR' : 'warn ';
    lines.push(`  ${tag}  ${issue.location.path}  [${issue.rule}]`);
    lines.push(`         ${issue.message}`);
  }
  lines.push('');
  return lines.join('\n');
}
