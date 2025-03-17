import React from 'react';

// Simple mock for FormGenerator component
const FormGenerator = ({ fields, initialData, onSubmit }: any) => (
  <div data-testid="form-generator">
    <div data-testid="form-fields">{JSON.stringify(fields)}</div>
    <div data-testid="form-initial-data">{JSON.stringify(initialData)}</div>
    <button data-testid="form-submit" onClick={() => onSubmit(initialData)}>
      Submit
    </button>
  </div>
);

export default FormGenerator;

// Export types for compatibility
export type FormFieldConfig = {
  id: string;
  label: string;
  elementType: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
  step?: number;
};

export type FormData = Record<string, string>;
