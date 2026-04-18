import React from "react";
import type { StepIndicatorProps } from "../types";

/**
 * Visual step progress indicator for multi-step forms.
 * Shows completed, current, and upcoming steps.
 */
export function StepIndicator({
  currentStep,
  totalSteps,
  completedSteps,
  steps,
  onStepClick,
  className = "",
}: StepIndicatorProps) {
  return (
    <nav className={`dfe-steps ${className}`} aria-label="Form progress">
      <ol className="dfe-steps__list">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = index === currentStep;
          const isClickable = isCompleted || index === currentStep;

          let status = "upcoming";
          if (isCurrent) status = "current";
          else if (isCompleted) status = "completed";

          return (
            <li
              key={step.id}
              className={`dfe-steps__item dfe-steps__item--${status}`}
            >
              <button
                type="button"
                className="dfe-steps__button"
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${index + 1}: ${step.title}${isCompleted ? " (completed)" : ""}`}
              >
                <span className="dfe-steps__number">
                  {isCompleted ? "✓" : index + 1}
                </span>
                <span className="dfe-steps__title">{step.title}</span>
              </button>
              {index < totalSteps - 1 && (
                <span className="dfe-steps__connector" />
              )}
            </li>
          );
        })}
      </ol>
      <div
        className="dfe-steps__progress"
        role="progressbar"
        aria-valuenow={currentStep + 1}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
      >
        <div
          className="dfe-steps__progress-bar"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>
    </nav>
  );
}
