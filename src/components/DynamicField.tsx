import React from "react";
import type { FieldConfig, CustomFieldProps } from "../types";
import type { UseFormRegisterReturn } from "react-hook-form";

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
export function DynamicField({
  field,
  registration,
  error,
  value,
  onChange,
}: DynamicFieldProps) {
  const baseClassName = `dfe-field dfe-field--${field.type}${error ? " dfe-field--error" : ""}`;

  if (field.type === "custom" && field.render) {
    const customProps: CustomFieldProps = {
      name: field.name,
      value,
      onChange,
      error,
      field,
    };
    return (
      <div
        className={baseClassName}
        style={{
          gridColumn: field.colSpan ? `span ${field.colSpan}` : undefined,
        }}
      >
        <label className="dfe-label">{field.label}</label>
        {field.render(customProps)}
        {error && <span className="dfe-error">{error}</span>}
        {field.helpText && <span className="dfe-help">{field.helpText}</span>}
      </div>
    );
  }

  const renderInput = () => {
    switch (field.type) {
      case "textarea":
        return (
          <textarea
            {...registration}
            placeholder={field.placeholder}
            className="dfe-textarea"
            rows={4}
          />
        );

      case "select":
        return (
          <select {...registration} className="dfe-select">
            <option value="">{field.placeholder ?? "Select..."}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div
            className="dfe-radio-group"
            role="radiogroup"
            aria-label={field.label}
          >
            {field.options?.map((opt) => (
              <label key={opt.value} className="dfe-radio-label">
                <input
                  type="radio"
                  {...registration}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="dfe-radio"
                />
                {opt.label}
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <label className="dfe-checkbox-label">
            <input type="checkbox" {...registration} className="dfe-checkbox" />
            {field.placeholder}
          </label>
        );

      case "file":
        return (
          <input
            type="file"
            {...registration}
            className="dfe-file"
            accept={field.props?.accept as string}
          />
        );

      default:
        return (
          <input
            type={field.type}
            {...registration}
            placeholder={field.placeholder}
            className="dfe-input"
          />
        );
    }
  };

  return (
    <div
      className={baseClassName}
      style={{
        gridColumn: field.colSpan ? `span ${field.colSpan}` : undefined,
      }}
    >
      {field.type !== "checkbox" && (
        <label className="dfe-label" htmlFor={field.name}>
          {field.label}
        </label>
      )}
      {renderInput()}
      {error && (
        <span className="dfe-error" role="alert">
          {error}
        </span>
      )}
      {field.helpText && !error && (
        <span className="dfe-help">{field.helpText}</span>
      )}
    </div>
  );
}
