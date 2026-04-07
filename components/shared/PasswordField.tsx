import { useMemo, useState } from "react";
import FormField from "./FormField";

const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Excellent"] as const;

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  helpText?: string;
  showStrength?: boolean;
  autoComplete?: string;
  hasError?: boolean;
};

function getStrengthScore(value: string): number {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 4);
}

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  required,
  minLength,
  helpText,
  showStrength,
  autoComplete,
  hasError,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const score = useMemo(() => getStrengthScore(value), [value]);
  const strengthLabel = strengthLabels[score] ?? "Weak";

  return (
    <FormField id={id} label={label} helpText={helpText}>
      <div className="form-field">
        <input
          className={`form-input form-input-password${hasError ? " is-error" : ""}`}
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      {showStrength ? (
        <div className={`password-strength strength-${score}`}>
          <span className="strength-label">Strength: {strengthLabel}</span>
          <div className="strength-bars" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : null}
    </FormField>
  );
}
