import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { lint, formatReport } from '../src/lint/lint';
import type { FormConfig } from '../src/types';

const valid = (): FormConfig => ({
  id: 'signup',
  onSubmit: () => {},
  steps: [
    {
      id: 'basics',
      title: 'Basics',
      fields: [
        { name: 'email', label: 'Email', type: 'email', required: true, validation: z.string().email() },
        {
          name: 'role',
          label: 'Role',
          type: 'select',
          options: [
            { label: 'Dev', value: 'dev' },
            { label: 'Design', value: 'design' },
          ],
        },
        {
          name: 'team',
          label: 'Team',
          type: 'text',
          conditions: [{ when: 'role', operator: 'equals', value: 'dev' }],
        },
      ],
    },
  ],
});

describe('lint — happy path', () => {
  it('clean config produces no issues', () => {
    const report = lint(valid());
    expect(report.ok).toBe(true);
    expect(report.errors).toBe(0);
    expect(report.warnings).toBe(0);
    expect(report.issues).toHaveLength(0);
  });

  it('formatReport returns checkmark when clean', () => {
    expect(formatReport(lint(valid()))).toMatch(/No issues/);
  });
});

describe('lint — structural errors', () => {
  it('flags empty steps', () => {
    const report = lint({ ...valid(), steps: [] });
    expect(report.ok).toBe(false);
    expect(report.issues[0]?.rule).toBe('empty-steps');
  });

  it('flags duplicate step ids', () => {
    const cfg = valid();
    cfg.steps.push({ id: 'basics', title: 'Dup', fields: [{ name: 'x', label: 'X', type: 'text' }] });
    const report = lint(cfg);
    expect(report.issues.some((i) => i.rule === 'duplicate-step-id')).toBe(true);
  });

  it('flags duplicate field names across steps', () => {
    const cfg = valid();
    cfg.steps.push({
      id: 'more',
      title: 'More',
      fields: [{ name: 'email', label: 'Email again', type: 'email' }],
    });
    const report = lint(cfg);
    const issue = report.issues.find((i) => i.rule === 'duplicate-field-name');
    expect(issue?.severity).toBe('error');
  });

  it('warns on empty step fields', () => {
    const cfg = valid();
    cfg.steps.push({ id: 'empty', title: 'Empty', fields: [] });
    const report = lint(cfg);
    expect(report.issues.some((i) => i.rule === 'empty-step-fields')).toBe(true);
  });
});

describe('lint — conditions', () => {
  it('errors on unknown condition target', () => {
    const cfg = valid();
    cfg.steps[0]!.fields[2]!.conditions = [{ when: 'nonExistent', operator: 'equals', value: 'x' }];
    const report = lint(cfg);
    const issue = report.issues.find((i) => i.rule === 'condition-unknown-field');
    expect(issue?.severity).toBe('error');
    expect(issue?.location.field).toBe('team');
  });

  it('errors on self-referencing condition', () => {
    const cfg = valid();
    cfg.steps[0]!.fields[2]!.conditions = [{ when: 'team', operator: 'equals', value: 'x' }];
    const report = lint(cfg);
    expect(report.issues.some((i) => i.rule === 'condition-self-reference')).toBe(true);
  });

  it('warns on forward reference across steps', () => {
    const cfg = valid();
    cfg.steps = [
      {
        id: 's1',
        title: 'S1',
        fields: [
          {
            name: 'a',
            label: 'A',
            type: 'text',
            conditions: [{ when: 'b', operator: 'equals', value: 'x' }],
          },
        ],
      },
      { id: 's2', title: 'S2', fields: [{ name: 'b', label: 'B', type: 'text' }] },
    ];
    const report = lint(cfg);
    const issue = report.issues.find((i) => i.rule === 'condition-forward-reference');
    expect(issue?.severity).toBe('warning');
  });

  it('errors when `in` operator gets non-array value', () => {
    const cfg = valid();
    cfg.steps[0]!.fields[2]!.conditions = [{ when: 'role', operator: 'in', value: 'dev' }];
    const report = lint(cfg);
    expect(report.issues.some((i) => i.rule === 'condition-in-non-array-value')).toBe(true);
  });

  it('warns when numeric operator targets non-numeric field', () => {
    const cfg = valid();
    cfg.steps[0]!.fields[2]!.conditions = [{ when: 'role', operator: 'gt', value: 5 }];
    const report = lint(cfg);
    expect(
      report.issues.some((i) => i.rule === 'condition-operator-type-mismatch')
    ).toBe(true);
  });
});

describe('lint — choice fields', () => {
  it('errors on select without options', () => {
    const cfg = valid();
    cfg.steps[0]!.fields.push({ name: 'country', label: 'Country', type: 'select' });
    const report = lint(cfg);
    expect(report.issues.some((i) => i.rule === 'select-without-options')).toBe(true);
  });

  it('errors on duplicate option values', () => {
    const cfg = valid();
    cfg.steps[0]!.fields[1]!.options = [
      { label: 'A', value: 'x' },
      { label: 'B', value: 'x' },
    ];
    const report = lint(cfg);
    expect(report.issues.some((i) => i.rule === 'duplicate-option-value')).toBe(true);
  });

  it('warns on options attached to non-choice field', () => {
    const cfg = valid();
    cfg.steps[0]!.fields[2]!.options = [{ label: 'A', value: 'a' }];
    const report = lint(cfg);
    expect(report.issues.some((i) => i.rule === 'options-on-non-choice-field')).toBe(true);
  });
});

describe('lint — validation drift', () => {
  it('warns when Zod schema type does not match field type', () => {
    const cfg = valid();
    cfg.steps[0]!.fields[0]!.validation = z.number(); // email field with ZodNumber
    const report = lint(cfg);
    expect(report.issues.some((i) => i.rule === 'validation-type-mismatch')).toBe(true);
  });

  it('does not false-positive on wrapped schemas (optional, effects)', () => {
    const cfg = valid();
    cfg.steps[0]!.fields[0]!.validation = z.string().email().optional();
    const report = lint(cfg);
    expect(report.issues.filter((i) => i.rule === 'validation-type-mismatch')).toHaveLength(0);
  });
});

describe('lint — misc', () => {
  it('errors on custom without render', () => {
    const cfg = valid();
    cfg.steps[0]!.fields.push({ name: 'signature', label: 'Sig', type: 'custom' });
    const report = lint(cfg);
    expect(report.issues.some((i) => i.rule === 'custom-without-render')).toBe(true);
  });

  it('errors on invalid colSpan', () => {
    const cfg = valid();
    cfg.steps[0]!.fields[0]!.colSpan = 13;
    const report = lint(cfg);
    expect(report.issues.some((i) => i.rule === 'invalid-col-span')).toBe(true);
  });

  it('warns when required field is conditionally hidden', () => {
    const cfg = valid();
    cfg.steps[0]!.fields[2]!.required = true;
    const report = lint(cfg);
    expect(
      report.issues.some((i) => i.rule === 'required-hidden-by-own-condition')
    ).toBe(true);
  });
});

describe('formatReport', () => {
  it('sorts errors before warnings and produces stable text', () => {
    const cfg = valid();
    cfg.steps[0]!.fields[2]!.conditions = [{ when: 'nope', operator: 'equals', value: 'x' }];
    cfg.steps[0]!.fields[2]!.required = true;
    const out = formatReport(lint(cfg));
    const errorPos = out.indexOf('ERROR');
    // Use '  warn ' (tag with surrounding spaces) to avoid matching 'warnings' in the summary line.
    const warnPos = out.indexOf('  warn ');
    expect(errorPos).toBeGreaterThanOrEqual(0);
    expect(warnPos).toBeGreaterThan(errorPos);
  });
});
