"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DynamicField: () => DynamicField,
  DynamicForm: () => DynamicForm,
  FormPreview: () => FormPreview,
  StepIndicator: () => StepIndicator,
  evaluateCondition: () => evaluateCondition,
  getVisibleFieldNames: () => getVisibleFieldNames,
  shouldShowField: () => shouldShowField,
  useFormEngine: () => useFormEngine
});
module.exports = __toCommonJS(index_exports);

// src/hooks/useFormEngine.ts
var import_react = require("react");
var import_react_hook_form = require("react-hook-form");
var import_zod = require("@hookform/resolvers/zod");
var import_zod2 = require("zod");

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
  const [currentStep, setCurrentStep] = (0, import_react.useState)(0);
  const [completedSteps, setCompletedSteps] = (0, import_react.useState)([]);
  const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
  const currentStepConfig = steps[currentStep];
  const stepSchema = (0, import_react.useMemo)(() => {
    const shape = {};
    for (const field of currentStepConfig.fields) {
      if (field.validation) {
        shape[field.name] = field.required ? field.validation : field.validation.optional();
      } else if (field.required) {
        shape[field.name] = import_zod2.z.string().min(1, `${field.label} is required`);
      }
    }
    return currentStepConfig.validation ?? import_zod2.z.object(shape);
  }, [currentStepConfig]);
  const form = (0, import_react_hook_form.useForm)({
    defaultValues,
    resolver: (0, import_zod.zodResolver)(stepSchema),
    mode: "onBlur"
  });
  const values = form.watch();
  const currentFields = (0, import_react.useMemo)(
    () => currentStepConfig.fields.filter((f) => shouldShowField(f.conditions, values)),
    [currentStepConfig.fields, values]
  );
  const nextStep = (0, import_react.useCallback)(async () => {
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
  const prevStep = (0, import_react.useCallback)(() => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      onStepChange?.(prev, form.getValues());
    }
  }, [currentStep, form, onStepChange]);
  const goToStep = (0, import_react.useCallback)(
    (step) => {
      if (step >= 0 && step < steps.length && completedSteps.includes(step - 1)) {
        setCurrentStep(step);
        onStepChange?.(step, form.getValues());
      }
    },
    [steps.length, completedSteps, form, onStepChange]
  );
  const submit = (0, import_react.useCallback)(async () => {
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
  const reset = (0, import_react.useCallback)(() => {
    form.reset(defaultValues);
    setCurrentStep(0);
    setCompletedSteps([]);
  }, [form, defaultValues]);
  const errors = (0, import_react.useMemo)(() => {
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
var import_jsx_runtime = require("react/jsx-runtime");
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
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        className: baseClassName,
        style: {
          gridColumn: field.colSpan ? `span ${field.colSpan}` : void 0
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: "dfe-label", children: field.label }),
          field.render(customProps),
          error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dfe-error", children: error }),
          field.helpText && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dfe-help", children: field.helpText })
        ]
      }
    );
  }
  const renderInput = () => {
    switch (field.type) {
      case "textarea":
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "textarea",
          {
            ...registration,
            placeholder: field.placeholder,
            className: "dfe-textarea",
            rows: 4
          }
        );
      case "select":
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { ...registration, className: "dfe-select", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: field.placeholder ?? "Select..." }),
          field.options?.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: opt.value, disabled: opt.disabled, children: opt.label }, opt.value))
        ] });
      case "radio":
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            className: "dfe-radio-group",
            role: "radiogroup",
            "aria-label": field.label,
            children: field.options?.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dfe-radio-label", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dfe-checkbox-label", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", ...registration, className: "dfe-checkbox" }),
          field.placeholder
        ] });
      case "file":
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "file",
            ...registration,
            className: "dfe-file",
            accept: field.props?.accept
          }
        );
      default:
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      className: baseClassName,
      style: {
        gridColumn: field.colSpan ? `span ${field.colSpan}` : void 0
      },
      children: [
        field.type !== "checkbox" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: "dfe-label", htmlFor: field.name, children: field.label }),
        renderInput(),
        error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dfe-error", role: "alert", children: error }),
        field.helpText && !error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dfe-help", children: field.helpText })
      ]
    }
  );
}

// src/components/StepIndicator.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function StepIndicator({
  currentStep,
  totalSteps,
  completedSteps,
  steps,
  onStepClick,
  className = ""
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("nav", { className: `dfe-steps ${className}`, "aria-label": "Form progress", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ol", { className: "dfe-steps__list", children: steps.map((step, index) => {
      const isCompleted = completedSteps.includes(index);
      const isCurrent = index === currentStep;
      const isClickable = isCompleted || index === currentStep;
      let status = "upcoming";
      if (isCurrent) status = "current";
      else if (isCompleted) status = "completed";
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
        "li",
        {
          className: `dfe-steps__item dfe-steps__item--${status}`,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
              "button",
              {
                type: "button",
                className: "dfe-steps__button",
                onClick: () => isClickable && onStepClick?.(index),
                disabled: !isClickable,
                "aria-current": isCurrent ? "step" : void 0,
                "aria-label": `Step ${index + 1}: ${step.title}${isCompleted ? " (completed)" : ""}`,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dfe-steps__number", children: isCompleted ? "\u2713" : index + 1 }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dfe-steps__title", children: step.title })
                ]
              }
            ),
            index < totalSteps - 1 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dfe-steps__connector" })
          ]
        },
        step.id
      );
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "div",
      {
        className: "dfe-steps__progress",
        role: "progressbar",
        "aria-valuenow": currentStep + 1,
        "aria-valuemin": 1,
        "aria-valuemax": totalSteps,
        children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
var import_jsx_runtime3 = require("react/jsx-runtime");
function FormPreview({
  values,
  steps,
  className = ""
}) {
  const hasValues = Object.values(values).some(
    (v) => v !== void 0 && v !== null && v !== ""
  );
  if (!hasValues) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("aside", { className: `dfe-preview dfe-preview--empty ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "dfe-preview__empty", children: "Start filling out the form to see a live preview." }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("aside", { className: `dfe-preview ${className}`, "aria-label": "Form preview", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "dfe-preview__title", children: "Live Preview" }),
    steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dfe-preview__section", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { className: "dfe-preview__section-title", children: step.title }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dl", { className: "dfe-preview__list", children: step.fields.map((field) => {
        const val = values[field.name];
        if (val === void 0 || val === null || val === "") return null;
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dfe-preview__item", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { className: "dfe-preview__label", children: field.label }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { className: "dfe-preview__value", children: typeof val === "boolean" ? val ? "Yes" : "No" : String(val) })
        ] }, field.name);
      }) })
    ] }, step.id))
  ] });
}

// src/components/DynamicForm.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
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
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_jsx_runtime4.Fragment, { children: children({
      state,
      actions,
      currentFields,
      currentStepConfig,
      registerField
    }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: `dfe-form-container ${className}`, children: [
    showProgress && state.totalSteps > 1 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      StepIndicator,
      {
        currentStep: state.currentStep,
        totalSteps: state.totalSteps,
        completedSteps: state.completedSteps,
        steps: config.steps,
        onStepClick: actions.goToStep
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dfe-form-layout", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
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
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dfe-form__header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { className: "dfe-form__title", children: currentStepConfig.title }),
              currentStepConfig.description && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "dfe-form__description", children: currentStepConfig.description })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dfe-form__fields", children: currentFields.map((field) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dfe-form__actions", children: [
              !state.isFirstStep && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "button",
                {
                  type: "button",
                  onClick: actions.prevStep,
                  className: "dfe-btn dfe-btn--secondary",
                  children: "\u2190 Back"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
      showPreview && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FormPreview, { values: state.values, steps: config.steps })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DynamicField,
  DynamicForm,
  FormPreview,
  StepIndicator,
  evaluateCondition,
  getVisibleFieldNames,
  shouldShowField,
  useFormEngine
});
