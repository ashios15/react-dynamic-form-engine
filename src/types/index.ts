import { z } from 'zod';

// ─── Field Types ───
export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'file'
  | 'custom';

export interface FieldOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface ConditionalRule {
  /** Field name to watch */
  when: string;
  /** Operator for comparison */
  operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt' | 'in';
  /** Value to compare against */
  value: unknown;
}

export interface FieldConfig {
  /** Unique field identifier */
  name: string;
  /** Display label */
  label: string;
  /** Field type */
  type: FieldType;
  /** Placeholder text */
  placeholder?: string;
  /** Default value */
  defaultValue?: unknown;
  /** Help text shown below the field */
  helpText?: string;
  /** Dropdown/radio options */
  options?: FieldOption[];
  /** Zod validation schema */
  validation?: z.ZodTypeAny;
  /** Conditional visibility rules */
  conditions?: ConditionalRule[];
  /** Whether the field is required */
  required?: boolean;
  /** Custom render function for type='custom' */
  render?: (props: CustomFieldProps) => React.ReactNode;
  /** Additional props passed to the field */
  props?: Record<string, unknown>;
  /** Column span (1-12 grid) */
  colSpan?: number;
}

export interface StepConfig {
  /** Unique step identifier */
  id: string;
  /** Step title */
  title: string;
  /** Optional step description */
  description?: string;
  /** Fields in this step */
  fields: FieldConfig[];
  /** Optional step-level validation */
  validation?: z.ZodTypeAny;
}

export interface FormConfig {
  /** Unique form identifier */
  id: string;
  /** Form steps — single step for simple forms */
  steps: StepConfig[];
  /** Default values for all fields */
  defaultValues?: Record<string, unknown>;
  /** Submit handler */
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  /** Called on each step change */
  onStepChange?: (step: number, data: Record<string, unknown>) => void;
  /** i18n namespace for labels */
  i18nNamespace?: string;
}

// ─── Render Props / Headless API ───
export interface FormEngineState {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  errors: Record<string, string>;
  values: Record<string, unknown>;
  completedSteps: number[];
}

export interface FormEngineActions {
  nextStep: () => Promise<boolean>;
  prevStep: () => void;
  goToStep: (step: number) => void;
  submit: () => Promise<void>;
  reset: () => void;
  setValue: (name: string, value: unknown) => void;
  clearErrors: () => void;
}

export interface FormEngineRenderProps {
  state: FormEngineState;
  actions: FormEngineActions;
  currentFields: FieldConfig[];
  currentStepConfig: StepConfig;
  registerField: (name: string) => Record<string, unknown>;
}

export interface CustomFieldProps {
  name: string;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  field: FieldConfig;
}

// ─── Component Props ───
export interface DynamicFormProps {
  config: FormConfig;
  children?: (props: FormEngineRenderProps) => React.ReactNode;
  className?: string;
  showProgress?: boolean;
  showPreview?: boolean;
}

export interface FormPreviewProps {
  values: Record<string, unknown>;
  steps: StepConfig[];
  className?: string;
}

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  steps: StepConfig[];
  onStepClick?: (step: number) => void;
  className?: string;
}
