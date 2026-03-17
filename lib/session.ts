export type UserSession = {
  userId: string | null;
  email: string | null;
  roles: string[];
};

type JwtPayload = Record<string, unknown>;

function normalizeRole(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function readRoles(payload: JwtPayload): string[] {
  const roleKeys = [
    "role",
    "roles",
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
  ];

  const collected: string[] = [];
  for (const key of roleKeys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      collected.push(value);
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim()) {
          collected.push(item);
        }
      }
    }
  }

  return Array.from(new Set(collected.map(normalizeRole).filter(Boolean)));
}

function getStringClaim(payload: JwtPayload, keys: string[]): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function decodePayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getUserSessionFromToken(token: string | null): UserSession {
  if (!token) {
    return { userId: null, email: null, roles: [] };
  }

  const payload = decodePayload(token);
  if (!payload) {
    return { userId: null, email: null, roles: [] };
  }

  return {
    userId: getStringClaim(payload, ["sub", "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]),
    email: getStringClaim(payload, ["email", "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"]),
    roles: readRoles(payload),
  };
}

export function hasRole(session: UserSession, role: "Admin" | "SuperAdmin"): boolean {
  if (role === "Admin") {
    return session.roles.includes("Admin") || session.roles.includes("Superadmin") || session.roles.includes("SuperAdmin");
  }
  return session.roles.includes("Superadmin") || session.roles.includes("SuperAdmin");
}

