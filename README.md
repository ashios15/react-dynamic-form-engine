# react-dynamic-form-engine

[![npm version](https://img.shields.io/npm/v/@ashios15/react-dynamic-form-engine)](https://www.npmjs.com/package/@ashios15/react-dynamic-form-engine)
[![CI](https://github.com/ashios15/react-dynamic-form-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/ashios15/react-dynamic-form-engine/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A **headless, config-driven multi-step form engine** built with React 19, TypeScript, React Hook Form, and Zod.

> Drop in a JSON config and get a fully functional multi-step form with validation, conditional fields, real-time preview, and i18n support.

<!-- ![Demo](./docs/demo.gif) -->

## Features

- **Config-driven** — Define forms with a simple JSON/TS schema
- **Multi-step** — Built-in step navigation with progress indicator
- **Conditional fields** — Show/hide fields based on other field values
- **Zod validation** — Type-safe schema validation per field or step
- **Live preview** — Real-time preview panel showing entered values
- **Headless mode** — Full render-prop API for custom UI
- **i18n-ready** — Namespace support for internationalization
- **Accessible** — ARIA labels, roles, and keyboard navigation
- **Tiny** — Zero CSS dependency, tree-shakeable

## Quick Start

```bash
npm install @ashios15/react-dynamic-form-engine react-hook-form zod @hookform/resolvers
```

```tsx
import { DynamicForm, type FormConfig } from '@ashios15/react-dynamic-form-engine';
import { z } from 'zod';

const config: FormConfig = {
  id: 'signup',
  steps: [
    {
      id: 'basics',
      title: 'Basic Info',
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          validation: z.string().email(),
        },
        {
          name: 'role',
          label: 'Role',
          type: 'select',
          options: [
            { label: 'Developer', value: 'dev' },
            { label: 'Designer', value: 'design' },
          ],
        },
        {
          name: 'team',
          label: 'Team Name',
          type: 'text',
          // Only shown when role is 'dev'
          conditions: [{ when: 'role', operator: 'equals', value: 'dev' }],
        },
      ],
    },
  ],
  onSubmit: (data) => console.log(data),
};

// Default UI
<DynamicForm config={config} showProgress showPreview />

// Headless mode — full control
<DynamicForm config={config}>
  {({ state, actions, currentFields, registerField }) => (
    // Your custom JSX here
  )}
</DynamicForm>
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
```

## Conditional Fields

Fields can be shown/hidden based on other field values:

```ts
{
  name: 'companyName',
  label: 'Company',
  type: 'text',
  conditions: [
    { when: 'accountType', operator: 'equals', value: 'business' },
    { when: 'country', operator: 'in', value: ['US', 'CA'] },
  ],
}
```

Supported operators: `equals`, `not_equals`, `contains`, `gt`, `lt`, `in`

## API

### `<DynamicForm>`

| Prop | Type | Description |
|------|------|-------------|
| `config` | `FormConfig` | Form configuration object |
| `children` | `(props: RenderProps) => ReactNode` | Headless render prop |
| `showProgress` | `boolean` | Show step indicator (default: `true`) |
| `showPreview` | `boolean` | Show live preview panel (default: `false`) |

### `useFormEngine(config)`

Returns `{ state, actions, currentFields, registerField, form }`

Use this hook directly for maximum flexibility without the `<DynamicForm>` wrapper.

## Development

```bash
npm install
npm run dev          # Storybook
npm run test         # Vitest
npm run build        # Build library
```

## License

MIT © [Ashish Joshi](https://github.com/ashios15)
