type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null;
}

function parseJsonIfString(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function collectMessages(payload: unknown): string[] {
  const parsed = parseJsonIfString(payload);

  if (parsed == null) return [];
  if (typeof parsed === "string") return parsed.trim() ? [parsed.trim()] : [];
  if (Array.isArray(parsed)) {
    return parsed.flatMap((item) => collectMessages(item));
  }
  if (!isRecord(parsed)) return [];

  const messages: string[] = [];
  const message = parsed.message;
  const title = parsed.title;
  const detail = parsed.detail;
  const error = parsed.error;
  const description = parsed.description;
  const reason = parsed.reason;

  if (typeof message === "string" && message.trim()) messages.push(message.trim());
  if (typeof detail === "string" && detail.trim()) messages.push(detail.trim());
  if (typeof title === "string" && title.trim()) messages.push(title.trim());
  if (typeof error === "string" && error.trim()) messages.push(error.trim());
  if (typeof description === "string" && description.trim()) messages.push(description.trim());
  if (typeof reason === "string" && reason.trim()) messages.push(reason.trim());

  // Identity-style error arrays: [{ code, description }]
  const topLevelArrayCandidates = [parsed.errors, parsed.errorDetails, parsed.validationErrors];
  for (const candidate of topLevelArrayCandidates) {
    if (!Array.isArray(candidate)) continue;
    for (const item of candidate) {
      if (!isRecord(item)) {
        messages.push(...collectMessages(item));
        continue;
      }
      const desc = item.description;
      const msg = item.message;
      const code = item.code;
      if (typeof desc === "string" && desc.trim()) {
        messages.push(desc.trim());
      } else if (typeof msg === "string" && msg.trim()) {
        messages.push(msg.trim());
      } else if (typeof code === "string" && code.trim()) {
        messages.push(code.trim());
      } else {
        messages.push(...collectMessages(item));
      }
    }
  }

  const errors = parsed.errors;
  if (isRecord(errors)) {
    for (const [field, value] of Object.entries(errors)) {
      const parts = collectMessages(value);
      if (parts.length === 0) continue;
      const joined = parts.join(", ");
      messages.push(field ? `${field}: ${joined}` : joined);
    }
  }

  return messages;
}

function isInternalErrorText(message: string): boolean {
  const value = message.toLowerCase();
  return (
    value.includes("exception") ||
    value.includes("stack trace") ||
    value.includes("system.") ||
    value.includes(" at ") ||
    value.includes("idx10")
  );
}

function sanitizeMessages(messages: string[], fallback: string): string {
  const unique = Array.from(new Set(messages.map((m) => m.trim()).filter(Boolean)));
  const safe = unique.filter((m) => !isInternalErrorText(m));
  if (safe.length > 0) return safe.join("\n");
  return fallback;
}

export function getApiErrorMessage(error: unknown, fallback = "Request failed."): string {
  const maybeAxios = error as {
    response?: { data?: unknown; statusText?: string; status?: number };
    message?: string;
  };

  const status = maybeAxios?.response?.status;
  if (typeof status === "number" && status >= 500) {
    return fallback;
  }

  const payload = maybeAxios?.response?.data;
  const payloadMessages = collectMessages(payload);
  if (payloadMessages.length > 0) return sanitizeMessages(payloadMessages, fallback);

  const statusText = maybeAxios?.response?.statusText;
  if (typeof statusText === "string" && statusText.trim()) return statusText.trim();

  const errorMessage = maybeAxios?.message;
  if (typeof errorMessage === "string" && errorMessage.trim()) {
    const parsedMessages = collectMessages(errorMessage);
    if (parsedMessages.length > 0) return sanitizeMessages(parsedMessages, fallback);
    if (isInternalErrorText(errorMessage.trim())) return fallback;
    return errorMessage.trim();
  }

  return fallback;
}

export async function getApiErrorMessageFromResponse(
  response: Response,
  fallback = "Request failed."
): Promise<string> {
  if (response.status >= 500) {
    return fallback;
  }

  try {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("json")) {
      const data = await response.json();
      const messages = collectMessages(data);
      if (messages.length > 0) return sanitizeMessages(messages, fallback);
    } else {
      const text = await response.text();
      const messages = collectMessages(text);
      if (messages.length > 0) return sanitizeMessages(messages, fallback);
    }
  } catch {
  }

  return fallback;
}
