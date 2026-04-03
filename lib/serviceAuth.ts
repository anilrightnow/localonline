let cachedToken: { value: string; expiresAt: number } | null = null;

function isServiceLoginDisabled() {
  const raw = String(
    process.env.API_SERVICE_LOGIN_DISABLED || process.env.SERVICE_LOGIN_DISABLED || "",
  )
    .trim()
    .toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

function isRetriableStatus(status: number) {
  return status === 500 || status === 502 || status === 503 || status === 504;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getServiceCredentials() {
  const email = String(process.env.API_SERVICE_EMAIL || "").trim();
  const password = String(process.env.API_SERVICE_PASSWORD || "").trim();
  return { email, password };
}

export async function getServiceToken(apiBaseUrl: string): Promise<string | null> {
  if (isServiceLoginDisabled()) {
    return null;
  }
  const { email, password } = getServiceCredentials();
  if (!email || !password) {
    throw new Error("Service credentials missing (API_SERVICE_EMAIL/API_SERVICE_PASSWORD).");
  }
//console.log("Fetching service token...",email,password);
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.value;
  }

  let res: Response | null = null;
  for (let attempt = 0; attempt <= 2; attempt += 1) {
    try {
      res = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok && isRetriableStatus(res.status) && attempt < 2) {
        await sleep(350 * (attempt + 1));
        continue;
      }
      break;
    } catch (err) {
      if (attempt >= 2) {
        throw err;
      }
      await sleep(350 * (attempt + 1));
    }
  }
  if (!res) {
    throw new Error("Service login failed: no response.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Service login failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw new Error("Service login failed: no access token.");
  }
  const expiresIn = Number(data.expires_in || 1800);
  cachedToken = { value: data.access_token, expiresAt: now + expiresIn * 1000 };
  return data.access_token;
}

export async function fetchWithServiceAuth(
  apiBaseUrl: string,
  url: string,
  init?: RequestInit,
  authToken?: string | null,
): Promise<Response> {
  const token = authToken ?? (await getServiceToken(apiBaseUrl));
  const headers = new Headers(init?.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}

export async function fetchSitemapWithServiceAuth(
  apiBaseUrl: string,
  url: string,
  init?: RequestInit,
  authToken?: string | null,
): Promise<Response> {
  const token = authToken ?? (await getServiceToken(apiBaseUrl));
  const headers = new Headers(init?.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/xml");
  return fetch(url, { ...init, headers });
}
