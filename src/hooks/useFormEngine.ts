import { useState, useCallback, useMemo } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
  FormConfig,
  FormEngineState,
  FormEngineActions,
  FormEngineRenderProps,
  FieldConfig,
} from '../types';
import { shouldShowField } from '../utils/conditions';

/**
 * Core hook powering the form engine.
 * Manages multi-step navigation, conditional visibility, validation, and state.
 */
export function useFormEngine(config: FormConfig): FormEngineRenderProps & { form: UseFormReturn } {
  const { steps, defaultValues = {}, onSubmit, onStepChange } = config;
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build Zod schema for current step
  const currentStepConfig = steps[currentStep];
  const stepSchema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const field of currentStepConfig.fields) {
      if (field.validation) {
        shape[field.name] = field.required
          ? field.validation
          : field.validation.optional();
      } else if (field.required) {
        shape[field.name] = z.string().min(1, `${field.label} is required`);
      }
    }
    return currentStepConfig.validation ?? z.object(shape);
  }, [currentStepConfig]);

  const form = useForm({
    defaultValues: defaultValues as Record<string, unknown>,
    resolver: zodResolver(stepSchema),
    mode: 'onBlur',
  });

  const values = form.watch();

  // Filter fields based on conditional visibility
  const currentFields: FieldConfig[] = useMemo(
    () => currentStepConfig.fields.filter((f) => shouldShowField(f.conditions, values)),
    [currentStepConfig.fields, values]
  );

  const nextStep = useCallback(async (): Promise<boolean> => {
    const valid = await form.trigger();
    if (!valid) return false;

    setCompletedSteps((prev) =>
      prev.includes(currentStep) ? prev : [...prev, currentStep]
    );

    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      onStepChange?.(next, form.getValues());
      return true;
    }
    return false;
  }, [currentStep, steps.length, form, onStepChange]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      onStepChange?.(prev, form.getValues());
    }
  }, [currentStep, form, onStepChange]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < steps.length && completedSteps.includes(step - 1)) {
        setCurrentStep(step);
        onStepChange?.(step, form.getValues());
      }
    },
    [steps.length, completedSteps, form, onStepChange]
  );

  const submit = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) return;

    setIsSubmitting(true);
    try {
      await onSubmit(form.getValues());
      setCompletedSteps((prev) =>
        prev.includes(currentStep) ? prev : [...prev, currentStep]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onSubmit, currentStep]);

  const reset = useCallback(() => {
    form.reset(defaultValues as Record<string, unknown>);
    setCurrentStep(0);
    setCompletedSteps([]);
  }, [form, defaultValues]);

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    for (const [key, err] of Object.entries(form.formState.errors)) {
      if (err?.message) errs[key] = err.message as string;
    }
    return errs;
  }, [form.formState.errors]);

  const state: FormEngineState = {
    currentStep,
    totalSteps: steps.length,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    isSubmitting,
    errors,
    values,
    completedSteps,
  };

  const actions: FormEngineActions = {
    nextStep,
    prevStep,
    goToStep,
    submit,
    reset,
    setValue: form.setValue,
    clearErrors: form.clearErrors,
  };

  const registerField = (name: string) => form.register(name);

  return {
    state,
    actions,
    currentFields,
    currentStepConfig,
    registerField,
    form,
  };
}
