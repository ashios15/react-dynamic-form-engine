import React from "react";
import type { FormPreviewProps } from "../types";

/**
 * Real-time preview panel showing all entered form values.
 * Updates as the user types.
 */
export function FormPreview({
  values,
  steps,
  className = "",
}: FormPreviewProps) {
  const hasValues = Object.values(values).some(
    (v) => v !== undefined && v !== null && v !== "",
  );

  if (!hasValues) {
    return (
      <aside className={`dfe-preview dfe-preview--empty ${className}`}>
        <p className="dfe-preview__empty">
          Start filling out the form to see a live preview.
        </p>
      </aside>
    );
  }

  return (
    <aside className={`dfe-preview ${className}`} aria-label="Form preview">
      <h3 className="dfe-preview__title">Live Preview</h3>
      {steps.map((step) => (
        <div key={step.id} className="dfe-preview__section">
          <h4 className="dfe-preview__section-title">{step.title}</h4>
          <dl className="dfe-preview__list">
            {step.fields.map((field) => {
              const val = values[field.name];
              if (val === undefined || val === null || val === "") return null;
              return (
                <div key={field.name} className="dfe-preview__item">
                  <dt className="dfe-preview__label">{field.label}</dt>
                  <dd className="dfe-preview__value">
                    {typeof val === "boolean"
                      ? val
                        ? "Yes"
                        : "No"
                      : String(val)}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      ))}
    </aside>
  );
}
