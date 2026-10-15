/**
 * CropShield AI — Centralised API Client
 *
 * Resolves the correct backend base URL at runtime:
 *   - In Vercel production: uses VITE_API_URL (https://cropshield-cc.onrender.com)
 *   - In local development: empty string → relative paths → same-origin Express server
 *
 * NEVER import GEMINI_API_KEY or any server-side secret here.
 * Only VITE_* prefixed variables are safe to use in frontend code.
 */

/**
 * Base URL for all /api/* requests.
 *
 * When VITE_API_URL is set (Vercel deployment), all API calls are routed to
 * the Render backend. When it is not set (local monolith dev), relative paths
 * are used and Express serves the API on the same origin.
 */
export const API_BASE_URL: string =
  (import.meta.env?.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

/**
 * Build a full API URL by appending the path to the base URL.
 *
 * @example
 *   apiUrl('/api/weather?district=Thanjavur')
 *   // → 'https://cropshield-cc.onrender.com/api/weather?district=Thanjavur'  (Vercel)
 *   // → '/api/weather?district=Thanjavur'                                     (local)
 */
export function apiUrl(path: string): string {
  // Ensure exactly one slash between base and path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

/**
 * Thin wrapper around fetch() that:
 *   - Prepends the correct API base URL automatically
 *   - Logs the request URL on API failures (never logs request bodies or secrets)
 *   - Passes credentials only for same-origin requests (avoids CORS pre-flight issues with cookies)
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = apiUrl(path);
  const isAbsolute = url.startsWith('http');

  const response = await fetch(url, {
    ...options,
    // Do NOT send credentials cross-origin (Render backend uses no cookies)
    credentials: isAbsolute ? 'omit' : 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    console.error(
      `[CropShield API] ${options.method ?? 'GET'} ${url} → HTTP ${response.status} ${response.statusText}`
    );
  }

  return response;
}
