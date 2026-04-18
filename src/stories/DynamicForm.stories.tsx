import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";
import { DynamicForm } from "../src/components/DynamicForm";
import type { FormConfig } from "../src/types";

const meta: Meta<typeof DynamicForm> = {
  title: "DynamicForm/MultiStepForm",
  component: DynamicForm,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof DynamicForm>;

const contactFormConfig: FormConfig = {
  id: "contact-form",
  steps: [
    {
      id: "personal",
      title: "Personal Information",
      description: "Tell us about yourself",
      fields: [
        {
          name: "firstName",
          label: "First Name",
          type: "text",
          placeholder: "John",
          required: true,
          validation: z.string().min(2, "Must be at least 2 characters"),
          colSpan: 6,
        },
        {
          name: "lastName",
          label: "Last Name",
          type: "text",
          placeholder: "Doe",
          required: true,
          colSpan: 6,
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          placeholder: "john@example.com",
          required: true,
          validation: z.string().email("Valid email required"),
        },
        {
          name: "accountType",
          label: "Account Type",
          type: "select",
          options: [
            { label: "Personal", value: "personal" },
            { label: "Business", value: "business" },
          ],
          required: true,
        },
        {
          name: "companyName",
          label: "Company Name",
          type: "text",
          placeholder: "Acme Inc.",
          conditions: [
            { when: "accountType", operator: "equals", value: "business" },
          ],
          required: true,
        },
      ],
    },
    {
      id: "preferences",
      title: "Preferences",
      description: "Customize your experience",
      fields: [
        {
          name: "newsletter",
          label: "Newsletter",
          type: "checkbox",
          placeholder: "Subscribe to our newsletter",
        },
        {
          name: "frequency",
          label: "Email Frequency",
          type: "radio",
          options: [
            { label: "Daily", value: "daily" },
            { label: "Weekly", value: "weekly" },
            { label: "Monthly", value: "monthly" },
          ],
          conditions: [{ when: "newsletter", operator: "equals", value: true }],
        },
        {
          name: "bio",
          label: "Short Bio",
          type: "textarea",
          placeholder: "Tell us about yourself...",
          helpText: "Maximum 500 characters",
          validation: z.string().max(500).optional(),
        },
      ],
    },
    {
      id: "review",
      title: "Review & Submit",
      description: "Review your information before submitting",
      fields: [
        {
          name: "terms",
          label: "Terms",
          type: "checkbox",
          placeholder: "I agree to the terms and conditions",
          required: true,
        },
      ],
    },
  ],
  onSubmit: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    alert(JSON.stringify(data, null, 2));
  },
};

export const MultiStep: Story = {
  args: {
    config: contactFormConfig,
    showProgress: true,
    showPreview: true,
  },
};

export const Headless: Story = {
  args: {
    config: contactFormConfig,
  },
  render: (args) => (
    <DynamicForm {...args}>
      {({ state, actions, currentFields, registerField }) => (
        <div style={{ maxWidth: 400, fontFamily: "sans-serif" }}>
          <h3>
            Step {state.currentStep + 1} of {state.totalSteps}
          </h3>
          {currentFields.map((field) => (
            <div key={field.name} style={{ marginBottom: 12 }}>
              <label>{field.label}</label>
              <input
                {...registerField(field.name)}
                style={{ display: "block", width: "100%", padding: 8 }}
              />
              {state.errors[field.name] && (
                <span style={{ color: "red", fontSize: 12 }}>
                  {state.errors[field.name]}
                </span>
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {!state.isFirstStep && (
              <button onClick={actions.prevStep}>Back</button>
            )}
            <button
              onClick={state.isLastStep ? actions.submit : actions.nextStep}
            >
              {state.isLastStep ? "Submit" : "Next"}
            </button>
          </div>
        </div>
      )}
    </DynamicForm>
  ),
};
