import { ReactNode } from "react";

type FormFieldProps = {
  id?: string;
  label: string;
  helpText?: string;
  children: ReactNode;
};

export default function FormField({ id, label, helpText, children }: FormFieldProps) {
  return (
    <div className="form-row">
      <label htmlFor={id}>{label}</label>
      {children}
      {helpText ? <span className="form-help">{helpText}</span> : null}
    </div>
  );
}
