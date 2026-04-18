// src/hooks/useFormEngine.ts
import { useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// src/utils/conditions.ts
function evaluateCondition(rule, values) {
  const fieldValue = values[rule.when];
  switch (rule.operator) {
    case "equals":
      return fieldValue === rule.value;
    case "not_equals":
      return fieldValue !== rule.value;
    case "contains":
      return typeof fieldValue === "string" && fieldValue.includes(String(rule.value));
    case "gt":
      return typeof fieldValue === "number" && fieldValue > Number(rule.value);
    case "lt":
      return typeof fieldValue === "number" && fieldValue < Number(rule.value);
    case "in":
      return Array.isArray(rule.value) && rule.value.includes(fieldValue);
    default:
      return true;
  }
}
function shouldShowField(conditions, values) {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((rule) => evaluateCondition(rule, values));
}
function getVisibleFieldNames(fields, values) {
  return fields.filter((field) => shouldShowField(field.conditions, values)).map((field) => field.name);
}

// src/hooks/useFormEngine.ts
function useFormEngine(config) {
  const { steps, defaultValues = {}, onSubmit, onStepChange } = config;
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentStepConfig = steps[currentStep];
  const stepSchema = useMemo(() => {
    const shape = {};
    for (const field of currentStepConfig.fields) {
      if (field.validation) {
        shape[field.name] = field.required ? field.validation : field.validation.optional();
      } else if (field.required) {
        shape[field.name] = z.string().min(1, `${field.label} is required`);
      }
    }
    return currentStepConfig.validation ?? z.object(shape);
  }, [currentStepConfig]);
  const form = useForm({
    defaultValues,
    resolver: zodResolver(stepSchema),
    mode: "onBlur"
  });
  const values = form.watch();
  const currentFields = useMemo(
    () => currentStepConfig.fields.filter((f) => shouldShowField(f.conditions, values)),
    [currentStepConfig.fields, values]
  );
  const nextStep = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) return false;
    setCompletedSteps(
      (prev) => prev.includes(currentStep) ? prev : [...prev, currentStep]
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
    (step) => {
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
      setCompletedSteps(
        (prev) => prev.includes(currentStep) ? prev : [...prev, currentStep]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onSubmit, currentStep]);
  const reset = useCallback(() => {
    form.reset(defaultValues);
    setCurrentStep(0);
    setCompletedSteps([]);
  }, [form, defaultValues]);
  const errors = useMemo(() => {
    const errs = {};
    for (const [key, err] of Object.entries(form.formState.errors)) {
      if (err?.message) errs[key] = err.message;
    }
    return errs;
  }, [form.formState.errors]);
  const state = {
    currentStep,
    totalSteps: steps.length,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    isSubmitting,
    errors,
    values,
    completedSteps
  };
  const actions = {
    nextStep,
    prevStep,
    goToStep,
    submit,
    reset,
    setValue: form.setValue,
    clearErrors: form.clearErrors
  };
  const registerField = (name) => form.register(name);
  return {
    state,
    actions,
    currentFields,
    currentStepConfig,
    registerField,
    form
  };
}

// src/components/DynamicField.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function DynamicField({
  field,
  registration,
  error,
  value,
  onChange
}) {
  const baseClassName = `dfe-field dfe-field--${field.type}${error ? " dfe-field--error" : ""}`;
  if (field.type === "custom" && field.render) {
    const customProps = {
      name: field.name,
      value,
      onChange,
      error,
      field
    };
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: baseClassName,
        style: {
          gridColumn: field.colSpan ? `span ${field.colSpan}` : void 0
        },
        children: [
          /* @__PURE__ */ jsx("label", { className: "dfe-label", children: field.label }),
          field.render(customProps),
          error && /* @__PURE__ */ jsx("span", { className: "dfe-error", children: error }),
          field.helpText && /* @__PURE__ */ jsx("span", { className: "dfe-help", children: field.helpText })
        ]
      }
    );
  }
  const renderInput = () => {
    switch (field.type) {
      case "textarea":
        return /* @__PURE__ */ jsx(
          "textarea",
          {
            ...registration,
            placeholder: field.placeholder,
            className: "dfe-textarea",
            rows: 4
          }
        );
      case "select":
        return /* @__PURE__ */ jsxs("select", { ...registration, className: "dfe-select", children: [
          /* @__PURE__ */ jsx("option", { value: "", children: field.placeholder ?? "Select..." }),
          field.options?.map((opt) => /* @__PURE__ */ jsx("option", { value: opt.value, disabled: opt.disabled, children: opt.label }, opt.value))
        ] });
      case "radio":
        return /* @__PURE__ */ jsx(
          "div",
          {
            className: "dfe-radio-group",
            role: "radiogroup",
            "aria-label": field.label,
            children: field.options?.map((opt) => /* @__PURE__ */ jsxs("label", { className: "dfe-radio-label", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "radio",
                  ...registration,
                  value: opt.value,
                  disabled: opt.disabled,
                  className: "dfe-radio"
                }
              ),
              opt.label
            ] }, opt.value))
          }
        );
      case "checkbox":
        return /* @__PURE__ */ jsxs("label", { className: "dfe-checkbox-label", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", ...registration, className: "dfe-checkbox" }),
          field.placeholder
        ] });
      case "file":
        return /* @__PURE__ */ jsx(
          "input",
          {
            type: "file",
            ...registration,
            className: "dfe-file",
            accept: field.props?.accept
          }
        );
      default:
        return /* @__PURE__ */ jsx(
          "input",
          {
            type: field.type,
            ...registration,
            placeholder: field.placeholder,
            className: "dfe-input"
          }
        );
    }
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: baseClassName,
      style: {
        gridColumn: field.colSpan ? `span ${field.colSpan}` : void 0
      },
      children: [
        field.type !== "checkbox" && /* @__PURE__ */ jsx("label", { className: "dfe-label", htmlFor: field.name, children: field.label }),
        renderInput(),
        error && /* @__PURE__ */ jsx("span", { className: "dfe-error", role: "alert", children: error }),
        field.helpText && !error && /* @__PURE__ */ jsx("span", { className: "dfe-help", children: field.helpText })
      ]
    }
  );
}

// src/components/StepIndicator.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function StepIndicator({
  currentStep,
  totalSteps,
  completedSteps,
  steps,
  onStepClick,
  className = ""
}) {
  return /* @__PURE__ */ jsxs2("nav", { className: `dfe-steps ${className}`, "aria-label": "Form progress", children: [
    /* @__PURE__ */ jsx2("ol", { className: "dfe-steps__list", children: steps.map((step, index) => {
      const isCompleted = completedSteps.includes(index);
      const isCurrent = index === currentStep;
      const isClickable = isCompleted || index === currentStep;
      let status = "upcoming";
      if (isCurrent) status = "current";
      else if (isCompleted) status = "completed";
      return /* @__PURE__ */ jsxs2(
        "li",
        {
          className: `dfe-steps__item dfe-steps__item--${status}`,
          children: [
            /* @__PURE__ */ jsxs2(
              "button",
              {
                type: "button",
                className: "dfe-steps__button",
                onClick: () => isClickable && onStepClick?.(index),
                disabled: !isClickable,
                "aria-current": isCurrent ? "step" : void 0,
                "aria-label": `Step ${index + 1}: ${step.title}${isCompleted ? " (completed)" : ""}`,
                children: [
                  /* @__PURE__ */ jsx2("span", { className: "dfe-steps__number", children: isCompleted ? "\u2713" : index + 1 }),
                  /* @__PURE__ */ jsx2("span", { className: "dfe-steps__title", children: step.title })
                ]
              }
            ),
            index < totalSteps - 1 && /* @__PURE__ */ jsx2("span", { className: "dfe-steps__connector" })
          ]
        },
        step.id
      );
    }) }),
    /* @__PURE__ */ jsx2(
      "div",
      {
        className: "dfe-steps__progress",
        role: "progressbar",
        "aria-valuenow": currentStep + 1,
        "aria-valuemin": 1,
        "aria-valuemax": totalSteps,
        children: /* @__PURE__ */ jsx2(
          "div",
          {
            className: "dfe-steps__progress-bar",
            style: { width: `${(currentStep + 1) / totalSteps * 100}%` }
          }
        )
      }
    )
  ] });
}

// src/components/FormPreview.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function FormPreview({
  values,
  steps,
  className = ""
}) {
  const hasValues = Object.values(values).some(
    (v) => v !== void 0 && v !== null && v !== ""
  );
  if (!hasValues) {
    return /* @__PURE__ */ jsx3("aside", { className: `dfe-preview dfe-preview--empty ${className}`, children: /* @__PURE__ */ jsx3("p", { className: "dfe-preview__empty", children: "Start filling out the form to see a live preview." }) });
  }
  return /* @__PURE__ */ jsxs3("aside", { className: `dfe-preview ${className}`, "aria-label": "Form preview", children: [
    /* @__PURE__ */ jsx3("h3", { className: "dfe-preview__title", children: "Live Preview" }),
    steps.map((step) => /* @__PURE__ */ jsxs3("div", { className: "dfe-preview__section", children: [
      /* @__PURE__ */ jsx3("h4", { className: "dfe-preview__section-title", children: step.title }),
      /* @__PURE__ */ jsx3("dl", { className: "dfe-preview__list", children: step.fields.map((field) => {
        const val = values[field.name];
        if (val === void 0 || val === null || val === "") return null;
        return /* @__PURE__ */ jsxs3("div", { className: "dfe-preview__item", children: [
          /* @__PURE__ */ jsx3("dt", { className: "dfe-preview__label", children: field.label }),
          /* @__PURE__ */ jsx3("dd", { className: "dfe-preview__value", children: typeof val === "boolean" ? val ? "Yes" : "No" : String(val) })
        ] }, field.name);
      }) })
    ] }, step.id))
  ] });
}

// src/components/DynamicForm.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function DynamicForm({
  config,
  children,
  className = "",
  showProgress = true,
  showPreview = false
}) {
  const engine = useFormEngine(config);
  const {
    state,
    actions,
    currentFields,
    currentStepConfig,
    registerField,
    form
  } = engine;
  if (children) {
    return /* @__PURE__ */ jsx4(Fragment, { children: children({
      state,
      actions,
      currentFields,
      currentStepConfig,
      registerField
    }) });
  }
  return /* @__PURE__ */ jsxs4("div", { className: `dfe-form-container ${className}`, children: [
    showProgress && state.totalSteps > 1 && /* @__PURE__ */ jsx4(
      StepIndicator,
      {
        currentStep: state.currentStep,
        totalSteps: state.totalSteps,
        completedSteps: state.completedSteps,
        steps: config.steps,
        onStepClick: actions.goToStep
      }
    ),
    /* @__PURE__ */ jsxs4("div", { className: "dfe-form-layout", children: [
      /* @__PURE__ */ jsxs4(
        "form",
        {
          className: "dfe-form",
          onSubmit: (e) => {
            e.preventDefault();
            if (state.isLastStep) actions.submit();
            else actions.nextStep();
          },
          noValidate: true,
          children: [
            /* @__PURE__ */ jsxs4("div", { className: "dfe-form__header", children: [
              /* @__PURE__ */ jsx4("h2", { className: "dfe-form__title", children: currentStepConfig.title }),
              currentStepConfig.description && /* @__PURE__ */ jsx4("p", { className: "dfe-form__description", children: currentStepConfig.description })
            ] }),
            /* @__PURE__ */ jsx4("div", { className: "dfe-form__fields", children: currentFields.map((field) => /* @__PURE__ */ jsx4(
              DynamicField,
              {
                field,
                registration: form.register(field.name),
                error: state.errors[field.name],
                value: state.values[field.name],
                onChange: (v) => actions.setValue(field.name, v)
              },
              field.name
            )) }),
            /* @__PURE__ */ jsxs4("div", { className: "dfe-form__actions", children: [
              !state.isFirstStep && /* @__PURE__ */ jsx4(
                "button",
                {
                  type: "button",
                  onClick: actions.prevStep,
                  className: "dfe-btn dfe-btn--secondary",
                  children: "\u2190 Back"
                }
              ),
              /* @__PURE__ */ jsx4(
                "button",
                {
                  type: "submit",
                  className: "dfe-btn dfe-btn--primary",
                  disabled: state.isSubmitting,
                  children: state.isSubmitting ? "Submitting..." : state.isLastStep ? "Submit" : "Next \u2192"
                }
              )
            ] })
          ]
        }
      ),
      showPreview && /* @__PURE__ */ jsx4(FormPreview, { values: state.values, steps: config.steps })
    ] })
  ] });
}
export {
  DynamicField,
  DynamicForm,
  FormPreview,
  StepIndicator,
  evaluateCondition,
  getVisibleFieldNames,
  shouldShowField,
  useFormEngine
};
