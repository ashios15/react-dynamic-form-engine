import { describe, it, expect } from 'vitest';
import { evaluateCondition, shouldShowField, getVisibleFieldNames } from '../src/utils/conditions';
import type { ConditionalRule } from '../src/types';

describe('evaluateCondition', () => {
  it('equals — matches when values are identical', () => {
    const rule: ConditionalRule = { when: 'country', operator: 'equals', value: 'US' };
    expect(evaluateCondition(rule, { country: 'US' })).toBe(true);
    expect(evaluateCondition(rule, { country: 'UK' })).toBe(false);
  });

  it('not_equals — matches when values differ', () => {
    const rule: ConditionalRule = { when: 'type', operator: 'not_equals', value: 'admin' };
    expect(evaluateCondition(rule, { type: 'user' })).toBe(true);
    expect(evaluateCondition(rule, { type: 'admin' })).toBe(false);
  });

  it('contains — matches substrings', () => {
    const rule: ConditionalRule = { when: 'email', operator: 'contains', value: '@company' };
    expect(evaluateCondition(rule, { email: 'user@company.com' })).toBe(true);
    expect(evaluateCondition(rule, { email: 'user@gmail.com' })).toBe(false);
  });

  it('gt — numeric greater than', () => {
    const rule: ConditionalRule = { when: 'age', operator: 'gt', value: 18 };
    expect(evaluateCondition(rule, { age: 25 })).toBe(true);
    expect(evaluateCondition(rule, { age: 16 })).toBe(false);
  });

  it('lt — numeric less than', () => {
    const rule: ConditionalRule = { when: 'qty', operator: 'lt', value: 100 };
    expect(evaluateCondition(rule, { qty: 50 })).toBe(true);
    expect(evaluateCondition(rule, { qty: 150 })).toBe(false);
  });

  it('in — checks array membership', () => {
    const rule: ConditionalRule = { when: 'role', operator: 'in', value: ['admin', 'manager'] };
    expect(evaluateCondition(rule, { role: 'admin' })).toBe(true);
    expect(evaluateCondition(rule, { role: 'user' })).toBe(false);
  });
});

describe('shouldShowField', () => {
  it('returns true when no conditions exist', () => {
    expect(shouldShowField(undefined, {})).toBe(true);
    expect(shouldShowField([], {})).toBe(true);
  });

  it('returns true when all conditions pass', () => {
    const conditions: ConditionalRule[] = [
      { when: 'type', operator: 'equals', value: 'business' },
      { when: 'country', operator: 'equals', value: 'US' },
    ];
    expect(shouldShowField(conditions, { type: 'business', country: 'US' })).toBe(true);
  });

  it('returns false when any condition fails', () => {
    const conditions: ConditionalRule[] = [
      { when: 'type', operator: 'equals', value: 'business' },
      { when: 'country', operator: 'equals', value: 'US' },
    ];
    expect(shouldShowField(conditions, { type: 'business', country: 'UK' })).toBe(false);
  });
});

describe('getVisibleFieldNames', () => {
  it('returns only fields whose conditions are met', () => {
    const fields = [
      { name: 'name', conditions: undefined },
      { name: 'company', conditions: [{ when: 'type', operator: 'equals' as const, value: 'business' }] },
      { name: 'email', conditions: undefined },
    ];
    const result = getVisibleFieldNames(fields, { type: 'personal' });
    expect(result).toEqual(['name', 'email']);
  });
});
