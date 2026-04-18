import * as react_jsx_runtime from 'react/jsx-runtime';
import { z } from 'zod';
import { UseFormRegisterReturn, UseFormReturn } from 'react-hook-form';

type FieldType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file' | 'custom';
interface FieldOption {
    label: string;
    value: string;
    disabled?: boolean;
}
interface ConditionalRule {
    /** Field name to watch */
    when: string;
    /** Operator for comparison */
    operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt' | 'in';
    /** Value to compare against */
    value: unknown;
}
interface FieldConfig {
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
interface StepConfig {
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
interface FormConfig {
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
interface FormEngineState {
    currentStep: number;
    totalSteps: number;
    isFirstStep: boolean;
    isLastStep: boolean;
    isSubmitting: boolean;
    errors: Record<string, string>;
    values: Record<string, unknown>;
    completedSteps: number[];
}
interface FormEngineActions {
    nextStep: () => Promise<boolean>;
    prevStep: () => void;
    goToStep: (step: number) => void;
    submit: () => Promise<void>;
    reset: () => void;
    setValue: (name: string, value: unknown) => void;
    clearErrors: () => void;
}
interface FormEngineRenderProps {
    state: FormEngineState;
    actions: FormEngineActions;
    currentFields: FieldConfig[];
    currentStepConfig: StepConfig;
    registerField: (name: string) => Record<string, unknown>;
}
interface CustomFieldProps {
    name: string;
    value: unknown;
    onChange: (value: unknown) => void;
    error?: string;
    field: FieldConfig;
}
interface DynamicFormProps {
    config: FormConfig;
    children?: (props: FormEngineRenderProps) => React.ReactNode;
    className?: string;
    showProgress?: boolean;
    showPreview?: boolean;
}
interface FormPreviewProps {
    values: Record<string, unknown>;
    steps: StepConfig[];
    className?: string;
}
interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
    completedSteps: number[];
    steps: StepConfig[];
    onStepClick?: (step: number) => void;
    className?: string;
}

/**
 * DynamicForm — the main component.
 *
 * Supports two modes:
 * 1. **Headless** (render props) — pass `children` as a function for full control
 * 2. **Default UI** — renders a styled form with step navigation and preview
 *
 * @example
 * ```tsx
 * // Default UI
 * <DynamicForm config={formConfig} showProgress showPreview />
 *
 * // Headless mode
 * <DynamicForm config={formConfig}>
 *   {({ state, actions, currentFields, registerField }) => (
 *     <div>
 *       {currentFields.map(field => (
 *         <input key={field.name} {...registerField(field.name)} />
 *       ))}
 *       <button onClick={actions.nextStep}>Next</button>
 *     </div>
 *   )}
 * </DynamicForm>
 * ```
 */
declare function DynamicForm({ config, children, className, showProgress, showPreview, }: DynamicFormProps): react_jsx_runtime.JSX.Element;

interface DynamicFieldProps {
    field: FieldConfig;
    registration: UseFormRegisterReturn;
    error?: string;
    value: unknown;
    onChange: (value: unknown) => void;
}
/**
 * Renders a single form field based on its FieldConfig type.
 * Supports text, email, select, radio, checkbox, textarea, number, date, file, and custom.
 */
declare function DynamicField({ field, registration, error, value, onChange, }: DynamicFieldProps): react_jsx_runtime.JSX.Element;

/**
 * Visual step progress indicator for multi-step forms.
 * Shows completed, current, and upcoming steps.
 */
declare function StepIndicator({ currentStep, totalSteps, completedSteps, steps, onStepClick, className, }: StepIndicatorProps): react_jsx_runtime.JSX.Element;

/**
 * Real-time preview panel showing all entered form values.
 * Updates as the user types.
 */
declare function FormPreview({ values, steps, className, }: FormPreviewProps): react_jsx_runtime.JSX.Element;

/**
 * Core hook powering the form engine.
 * Manages multi-step navigation, conditional visibility, validation, and state.
 */
declare function useFormEngine(config: FormConfig): FormEngineRenderProps & {
    form: UseFormReturn;
};

/**
 * Evaluates a conditional rule against the current form values.
 */
declare function evaluateCondition(rule: ConditionalRule, values: Record<string, unknown>): boolean;
/**
 * Checks if all conditions for a field are met.
 * Returns true if field should be visible.
 */
declare function shouldShowField(conditions: ConditionalRule[] | undefined, values: Record<string, unknown>): boolean;
/**
 * Generates a Zod schema object from field configs for a single step.
 */
declare function getVisibleFieldNames(fields: Array<{
    name: string;
    conditions?: ConditionalRule[];
}>, values: Record<string, unknown>): string[];

export { type ConditionalRule, type CustomFieldProps, DynamicField, DynamicForm, type DynamicFormProps, type FieldConfig, type FieldOption, type FieldType, type FormConfig, type FormEngineActions, type FormEngineRenderProps, type FormEngineState, FormPreview, type FormPreviewProps, type StepConfig, StepIndicator, type StepIndicatorProps, evaluateCondition, getVisibleFieldNames, shouldShowField, useFormEngine };
