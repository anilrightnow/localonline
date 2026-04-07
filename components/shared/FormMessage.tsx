type FormMessageProps = {
  message?: string | null;
  tone?: "success" | "error";
};

export default function FormMessage({ message, tone = "success" }: FormMessageProps) {
  if (!message) return null;
  return (
    <div className={`form-message ${tone === "error" ? "is-error" : "is-success"}`}>
      {message}
    </div>
  );
}
