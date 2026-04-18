// react-dynamic-form-engine
// A headless, config-driven multi-step form engine

// Components
export { DynamicForm } from './components/DynamicForm';
export { DynamicField } from './components/DynamicField';
export { StepIndicator } from './components/StepIndicator';
export { FormPreview } from './components/FormPreview';

// Hooks
export { useFormEngine } from './hooks/useFormEngine';

// Utilities
export { evaluateCondition, shouldShowField, getVisibleFieldNames } from './utils/conditions';

// Types
export type {
  FieldType,
  FieldOption,
  FieldConfig,
  StepConfig,
  FormConfig,
  ConditionalRule,
  FormEngineState,
  FormEngineActions,
  FormEngineRenderProps,
  CustomFieldProps,
  DynamicFormProps,
  FormPreviewProps,
  StepIndicatorProps,
} from './types';
