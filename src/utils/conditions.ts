import type { ConditionalRule } from '../types';

/**
 * Evaluates a conditional rule against the current form values.
 */
export function evaluateCondition(
  rule: ConditionalRule,
  values: Record<string, unknown>
): boolean {
  const fieldValue = values[rule.when];

  switch (rule.operator) {
    case 'equals':
      return fieldValue === rule.value;
    case 'not_equals':
      return fieldValue !== rule.value;
    case 'contains':
      return typeof fieldValue === 'string' && fieldValue.includes(String(rule.value));
    case 'gt':
      return typeof fieldValue === 'number' && fieldValue > Number(rule.value);
    case 'lt':
      return typeof fieldValue === 'number' && fieldValue < Number(rule.value);
    case 'in':
      return Array.isArray(rule.value) && rule.value.includes(fieldValue);
    default:
      return true;
  }
}

/**
 * Checks if all conditions for a field are met.
 * Returns true if field should be visible.
 */
export function shouldShowField(
  conditions: ConditionalRule[] | undefined,
  values: Record<string, unknown>
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((rule) => evaluateCondition(rule, values));
}

/**
 * Generates a Zod schema object from field configs for a single step.
 */
export function getVisibleFieldNames(
  fields: Array<{ name: string; conditions?: ConditionalRule[] }>,
  values: Record<string, unknown>
): string[] {
  return fields
    .filter((field) => shouldShowField(field.conditions, values))
    .map((field) => field.name);
}
