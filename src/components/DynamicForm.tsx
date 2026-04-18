import React from "react";
import type { DynamicFormProps } from "../types";
import { useFormEngine } from "../hooks/useFormEngine";
import { DynamicField } from "./DynamicField";
import { StepIndicator } from "./StepIndicator";
import { FormPreview } from "./FormPreview";

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
export function DynamicForm({
  config,
  children,
  className = "",
  showProgress = true,
  showPreview = false,
}: DynamicFormProps) {
  const engine = useFormEngine(config);
  const {
    state,
    actions,
    currentFields,
    currentStepConfig,
    registerField,
    form,
  } = engine;

  // ── Headless mode: render props ──
  if (children) {
    return (
      <>
        {children({
          state,
          actions,
          currentFields,
          currentStepConfig,
          registerField,
        })}
      </>
    );
  }

  // ── Default UI mode ──
  return (
    <div className={`dfe-form-container ${className}`}>
      {showProgress && state.totalSteps > 1 && (
        <StepIndicator
          currentStep={state.currentStep}
          totalSteps={state.totalSteps}
          completedSteps={state.completedSteps}
          steps={config.steps}
          onStepClick={actions.goToStep}
        />
      )}

      <div className="dfe-form-layout">
        <form
          className="dfe-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (state.isLastStep) actions.submit();
            else actions.nextStep();
          }}
          noValidate
        >
          <div className="dfe-form__header">
            <h2 className="dfe-form__title">{currentStepConfig.title}</h2>
            {currentStepConfig.description && (
              <p className="dfe-form__description">
                {currentStepConfig.description}
              </p>
            )}
          </div>

          <div className="dfe-form__fields">
            {currentFields.map((field) => (
              <DynamicField
                key={field.name}
                field={field}
                registration={form.register(field.name)}
                error={state.errors[field.name]}
                value={state.values[field.name]}
                onChange={(v) => actions.setValue(field.name, v)}
              />
            ))}
          </div>

          <div className="dfe-form__actions">
            {!state.isFirstStep && (
              <button
                type="button"
                onClick={actions.prevStep}
                className="dfe-btn dfe-btn--secondary"
              >
                ← Back
              </button>
            )}
            <button
              type="submit"
              className="dfe-btn dfe-btn--primary"
              disabled={state.isSubmitting}
            >
              {state.isSubmitting
                ? "Submitting..."
                : state.isLastStep
                  ? "Submit"
                  : "Next →"}
            </button>
          </div>
        </form>

        {showPreview && (
          <FormPreview values={state.values} steps={config.steps} />
        )}
      </div>
    </div>
  );
}
