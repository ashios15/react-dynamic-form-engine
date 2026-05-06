# React Dynamic Form Engine

[![npm version](https://img.shields.io/npm/v/@ashios15/react-dynamic-form-engine)](https://www.npmjs.com/package/@ashios15/react-dynamic-form-engine)
[![CI](https://github.com/ashios15/react-dynamic-form-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/ashios15/react-dynamic-form-engine/actions)
[![Tests](https://img.shields.io/badge/tests-30%20passing-green)](__tests__)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Headless, config-driven multi-step forms for React 19** — powered by React Hook Form and Zod, with a built-in static analyzer (`form-lint`) that catches broken field references, type drift, and structural mistakes at build time, not in production.

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [Multi-Step Wizard](#multi-step-wizard)
- [Headless Mode](#headless-mode--full-ui-control)
- [Custom Field Types](#custom-field-types)
- [useFormEngine Hook](#useformengine-hook)
- [Conditional Fields](#conditional-fields)
- [Static Analyzer — form-lint](#static-analyzer--form-lint)
- [API Reference](#api-reference)
- [Architecture](#architecture)
- [Development](#development)

## Install

```bash
npm install @ashios15/react-dynamic-form-engine react-hook-form zod @hookform/resolvers
```

Peer dependencies: `react ^19`, `react-dom ^19`, `react-hook-form ^7.54`, `zod ^3.23`, `@hookform/resolvers ^3.9`.

## Quick Start

The simplest possible form — one step, two fields, Zod validation:

```tsx
import { DynamicForm, type FormConfig } from '@ashios15/react-dynamic-form-engine';
import { z } from 'zod';

const config: FormConfig = {
  id: 'contact',
  steps: [
    {
      id: 'main',
      title: 'Contact Us',
      fields: [
        {
          name: 'email',
          label: 'Email address',
          type: 'email',
          required: true,
          validation: z.string().email('Enter a valid email'),
        },
        {
          name: 'message',
          label: 'Message',
          type: 'textarea',
          required: true,
          validation: z.string().min(10, 'At least 10 characters'),
        },
      ],
    },
  ],
  onSubmit: async (data) => {
    await fetch('/api/contact', { method: 'POST', body: JSON.stringify(data) });
  },
};

export function ContactForm() {
  return <DynamicForm config={config} />;
}
```

## Multi-Step Wizard

Split a long form across multiple steps. Each step validates independently before advancing:

```tsx
import { DynamicForm, type FormConfig } from '@ashios15/react-dynamic-form-engine';
import { z } from 'zod';

const onboardingConfig: FormConfig = {
  id: 'onboarding',
  defaultValues: { plan: 'starter' },
  steps: [
    {
      id: 'account',
      title: 'Create your account',
      description: 'Step 1 of 3',
      fields: [
        {
          name: 'email',
          label: 'Work email',
          type: 'email',
          required: true,
          validation: z.string().email(),
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          required: true,
          validation: z.string().min(8, 'Minimum 8 characters'),
        },
      ],
    },
    {
      id: 'profile',
      title: 'Tell us about yourself',
      description: 'Step 2 of 3',
      fields: [
        {
          name: 'firstName',
          label: 'First name',
          type: 'text',
          required: true,
          colSpan: 6,
        },
        {
          name: 'lastName',
          label: 'Last name',
          type: 'text',
          required: true,
          colSpan: 6,
        },
        {
          name: 'role',
          label: 'Your role',
          type: 'select',
          options: [
            { label: 'Engineer', value: 'eng' },
            { label: 'Designer', value: 'design' },
            { label: 'Product', value: 'pm' },
            { label: 'Other', value: 'other' },
          ],
        },
      ],
    },
    {
      id: 'plan',
      title: 'Choose a plan',
      description: 'Step 3 of 3',
      fields: [
        {
          name: 'plan',
          label: 'Plan',
          type: 'radio',
          options: [
            { label: 'Starter — free', value: 'starter' },
            { label: 'Pro — $12/mo', value: 'pro' },
            { label: 'Enterprise', value: 'enterprise' },
          ],
        },
        {
          name: 'teamSize',
          label: 'Team size',
          type: 'number',
          // Only visible when Enterprise is selected
          conditions: [{ when: 'plan', operator: 'equals', value: 'enterprise' }],
        },
      ],
    },
  ],
  onStepChange: (step, data) => {
    console.log(`Moved to step ${step}`, data);
  },
  onSubmit: async (data) => {
    await fetch('/api/onboard', { method: 'POST', body: JSON.stringify(data) });
  },
};

export function OnboardingWizard() {
  return <DynamicForm config={onboardingConfig} showProgress showPreview />;
}
```

## Headless Mode — Full UI Control

Pass a render function as `children` to take complete ownership of the UI. The engine still handles state, navigation, validation, and conditions:

```tsx
import { DynamicForm, DynamicField, type FormConfig } from '@ashios15/react-dynamic-form-engine';

export function CustomWizard({ config }: { config: FormConfig }) {
  return (
    <DynamicForm config={config}>
      {({ state, actions, currentFields, currentStepConfig, registerField }) => (
        <div className="wizard">
          {/* Your own step indicator */}
          <nav className="wizard__steps">
            {Array.from({ length: state.totalSteps }, (_, i) => (
              <span
                key={i}
                className={i === state.currentStep ? 'active' : i < state.currentStep ? 'done' : ''}
              >
                {i + 1}
              </span>
            ))}
          </nav>

          <h2>{currentStepConfig.title}</h2>

          {/* Render each visible field */}
          {currentFields.map((field) => (
            <DynamicField
              key={field.name}
              field={field}
              registration={registerField(field.name)}
              error={state.errors[field.name]}
              value={state.values[field.name]}
              onChange={(v) => actions.setValue(field.name, v)}
            />
          ))}

          {/* Error summary */}
          {Object.keys(state.errors).length > 0 && (
            <ul className="errors">
              {Object.entries(state.errors).map(([name, msg]) => (
                <li key={name}>{msg}</li>
              ))}
            </ul>
          )}

          <div className="wizard__actions">
            {!state.isFirstStep && (
              <button onClick={actions.prevStep}>Back</button>
            )}
            <button
              onClick={state.isLastStep ? actions.submit : actions.nextStep}
              disabled={state.isSubmitting}
            >
              {state.isLastStep ? (state.isSubmitting ? 'Submitting…' : 'Submit') : 'Continue'}
            </button>
          </div>
        </div>
      )}
    </DynamicForm>
  );
}
```

## Custom Field Types

Use `type: 'custom'` with a `render` function to embed any component inside the engine's validation and step flow:

```tsx
import { type FormConfig } from '@ashios15/react-dynamic-form-engine';
import { CountryPicker } from './CountryPicker';
import { RichTextEditor } from './RichTextEditor';

const config: FormConfig = {
  id: 'application',
  steps: [
    {
      id: 'details',
      title: 'Application details',
      fields: [
        {
          name: 'country',
          label: 'Country',
          type: 'custom',
          required: true,
          render: ({ value, onChange, error }) => (
            <div>
              <CountryPicker value={value as string} onChange={onChange} />
              {error && <p className="field-error">{error}</p>}
            </div>
          ),
        },
        {
          name: 'coverLetter',
          label: 'Cover letter',
          type: 'custom',
          render: ({ value, onChange }) => (
            <RichTextEditor
              initialValue={value as string}
              onChange={onChange}
            />
          ),
        },
      ],
    },
  ],
  onSubmit: (data) => console.log(data),
};
```

## `useFormEngine` Hook

Use the hook directly when you need access to the React Hook Form instance (`form`) or want to build a fully custom wrapper without `<DynamicForm>`:

```tsx
import { useFormEngine, type FormConfig } from '@ashios15/react-dynamic-form-engine';
import { z } from 'zod';

const config: FormConfig = {
  id: 'settings',
  steps: [
    {
      id: 'notifications',
      title: 'Notifications',
      fields: [
        { name: 'emailDigest', label: 'Email digest', type: 'checkbox' },
        {
          name: 'digestFrequency',
          label: 'How often',
          type: 'select',
          options: [
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
          ],
          conditions: [{ when: 'emailDigest', operator: 'equals', value: true }],
        },
        {
          name: 'slackWebhook',
          label: 'Slack webhook URL',
          type: 'text',
          validation: z.string().url().optional(),
        },
      ],
    },
  ],
  onSubmit: async (data) => {
    await fetch('/api/settings', { method: 'PATCH', body: JSON.stringify(data) });
  },
};

export function SettingsForm() {
  const { state, actions, currentFields, form } = useFormEngine(config);

  // Access react-hook-form directly for watch, formState, etc.
  const watchedValues = form.watch();

  return (
    <form onSubmit={(e) => { e.preventDefault(); actions.submit(); }}>
      {currentFields.map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name}>{field.label}</label>
          <input id={field.name} type={field.type} {...form.register(field.name)} />
          {state.errors[field.name] && (
            <span role="alert">{state.errors[field.name]}</span>
          )}
        </div>
      ))}
      <button type="submit" disabled={state.isSubmitting}>Save</button>

      {/* Debug panel during development */}
      {process.env.NODE_ENV === 'development' && (
        <pre>{JSON.stringify(watchedValues, null, 2)}</pre>
      )}
    </form>
  );
}
```

## Conditional Fields

Fields are shown or hidden based on the live values of other fields in the form. All evaluation is pure and synchronous — no effects, no timers.

```ts
{
  name: 'companyName',
  label: 'Company name',
  type: 'text',
  conditions: [
    // Both conditions must pass (AND logic)
    { when: 'accountType', operator: 'equals', value: 'business' },
    { when: 'country', operator: 'in', value: ['US', 'CA', 'GB'] },
  ],
}
```

**Supported operators:**

| Operator | Matches when |
|---|---|
| `equals` | `fieldValue === value` |
| `not_equals` | `fieldValue !== value` |
| `contains` | string field contains `value` as substring |
| `gt` | numeric field > `value` |
| `lt` | numeric field < `value` |
| `in` | `value` is an array and contains `fieldValue` |

## Static Analyzer — `form-lint`

Config bugs — dangling `when` references, `select` fields with no `options`, `required` fields hidden by their own conditions — don't produce TypeScript errors. They surface silently at runtime, often after submission.

`form-lint` checks 16 rules statically. It's pure TypeScript, no React, no DOM, safe in CI.

```bash
# Pipe a JSON config
cat forms/checkout.json | npx form-lint

# Pass a file path
npx form-lint forms/checkout.json

# JSON output for programmatic consumption
npx form-lint forms/checkout.json --json
```

**Example output:**

```
$ npx form-lint forms/checkout.json

Found 2 errors and 1 warning.

  ERROR  steps[1].fields[3].conditions[0].when  [condition-unknown-field]
         Field "billing_same" has a condition watching "useSameBilling", which does not exist in any step.
  ERROR  steps[0].fields[2].options  [select-without-options]
         Field "country" has type "select" but no options.
  warn   steps[1].fields[0]  [required-hidden-by-own-condition]
         Field "company" is required but hidden by conditions — validation only runs when visible.
```

Exit `0` — no errors (warnings allowed). Exit `2` — at least one error.

**Programmatic API** (also catches Zod schema/type mismatch, since schemas survive in TypeScript):

```ts
import { lint, formatReport } from '@ashios15/react-dynamic-form-engine/lint';
import { myFormConfig } from './forms/checkout';

const report = lint(myFormConfig);

if (!report.ok) {
  console.error(formatReport(report));
  // report.issues is typed: Array<{ rule, severity, message, location }>
  const errors = report.issues.filter((i) => i.severity === 'error');
  process.exit(1);
}
```

**JSON output** for integration with editors, CI dashboards, or custom reporters:

```json
{
  "ok": false,
  "errors": 2,
  "warnings": 1,
  "issues": [
    {
      "rule": "condition-unknown-field",
      "severity": "error",
      "message": "Field \"billing_same\" has a condition watching \"useSameBilling\", which does not exist in any step.",
      "location": { "path": "steps[1].fields[3].conditions[0].when", "stepIndex": 1, "field": "billing_same" }
    }
  ]
}
```

### Lint rules

| Rule | Severity | What it catches |
|---|---|---|
| `empty-steps` | error | Config has no steps |
| `empty-step-fields` | warning | A step has no fields |
| `duplicate-step-id` | error | Two steps share the same `id` |
| `duplicate-field-name` | error | Same field `name` in multiple steps |
| `select-without-options` | error | `select` or `radio` with no `options` |
| `duplicate-option-value` | error | Duplicate `value` in a field's options |
| `options-on-non-choice-field` | warning | `options` on a non-choice field (ignored at runtime) |
| `custom-without-render` | error | `type: 'custom'` with no `render` function |
| `invalid-col-span` | error | `colSpan` outside `[1, 12]` |
| `condition-unknown-field` | error | `when` references a field that doesn't exist |
| `condition-self-reference` | error | A field's condition watches itself |
| `condition-forward-reference` | warning | Field in step N depends on a field in step M > N |
| `condition-in-non-array-value` | error | Operator `in` used with a non-array value |
| `condition-operator-type-mismatch` | warning | Numeric operator against a non-numeric field, or `contains` against a non-string |
| `required-hidden-by-own-condition` | warning | `required` field is conditionally hidden |
| `validation-type-mismatch` | warning | Zod schema kind doesn't match field type |

### CI integration

```yaml
# .github/workflows/ci.yml
- run: npm ci
- run: npm test                         # vitest — 30 unit tests
- run: cat forms/*.json | npx form-lint # catch config bugs before deploy
```

## API Reference

### `<DynamicForm>`

| Prop | Type | Default | Description |
|---|---|---|---|
| `config` | `FormConfig` | — | Form configuration |
| `children` | `(props: RenderProps) => ReactNode` | — | Headless render prop — omit for default UI |
| `showProgress` | `boolean` | `true` | Show step indicator |
| `showPreview` | `boolean` | `false` | Show live value preview panel |
| `className` | `string` | `''` | Class applied to the outer container |

### `useFormEngine(config)`

```ts
const {
  state,        // FormEngineState — currentStep, totalSteps, isLastStep, isSubmitting, errors, values, completedSteps
  actions,      // FormEngineActions — nextStep, prevStep, goToStep, submit, reset, setValue, clearErrors
  currentFields,      // FieldConfig[] — visible fields for the current step (conditions already applied)
  currentStepConfig,  // StepConfig — the raw step definition
  registerField,      // (name: string) => react-hook-form register result
  form,         // UseFormReturn — direct access to react-hook-form instance
} = useFormEngine(config);
```

### `FormConfig`

```ts
interface FormConfig {
  id: string;
  steps: StepConfig[];
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  onStepChange?: (step: number, data: Record<string, unknown>) => void;
  i18nNamespace?: string;
}
```

### `FieldConfig`

```ts
interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file' | 'custom';
  placeholder?: string;
  defaultValue?: unknown;
  helpText?: string;
  options?: Array<{ label: string; value: string; disabled?: boolean }>;
  validation?: z.ZodTypeAny;
  conditions?: ConditionalRule[];
  required?: boolean;
  render?: (props: CustomFieldProps) => React.ReactNode; // for type: 'custom'
  colSpan?: number; // 1–12 grid column span
}
```

## Architecture

```
┌─────────────────────────────────────────┐
│           FormConfig (JSON/TS)          │
├─────────────────────────────────────────┤
│                                         │
│   useFormEngine (hook)                  │
│   ├── React Hook Form (validation)      │
│   ├── Zod (schema per step)             │
│   ├── Condition engine (show/hide)      │
│   └── Step state machine                │
│                                         │
├──────────────┬──────────────────────────┤
│  Default UI  │   Headless (render prop) │
│  ├── Field   │   → Full control         │
│  ├── Steps   │   → Your components      │
│  └── Preview │   → Your styling         │
└──────────────┴──────────────────────────┘

form-lint (pure TS, no React)
└── lint(config) → LintReport
    └── 16 rules: structure, conditions, types, Zod schema
```

## Development

```bash
npm install
npm run dev          # Storybook on http://localhost:6006
npm test             # Vitest (30 tests)
npm run build        # tsup dual ESM/CJS + CLI bin
npm run form-lint    # run form-lint via tsx without a build step
```

## License

MIT © [ashios15](https://github.com/ashios15)
