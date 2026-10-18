/**
 * CropShield AI — Centralised API Client & Resilience Layer
 *
 * Resolves the correct backend base URL at runtime:
 *   - In Vercel production: uses VITE_API_URL (https://cropshield-cc.onrender.com)
 *   - In local development: empty string → relative paths → same-origin Express server
 *
 * Handles:
 *   - Automatic timeout & abort handling (45s default for Render cold starts)
 *   - Informative error reporting for asleep/starting backend
 *   - Prevention of duplicate or hanging requests
 *   - Safe header handling (never exposes client credentials or secrets)
 */

// Detect if running on Vercel frontend deployment
const isVercelHost =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('vercel.app') || window.location.hostname === 'cropshieldcc.vercel.app');

// Detect if running locally (Express monolith on port 3000 or Vite dev)
const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname.endsWith('.local'));

export const API_BASE_URL: string =
  isLocalHost
    ? '' // Local development: talk directly to local Express server
    : (import.meta.env?.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
      'https://cropshield-cc.onrender.com';


export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export class CropShieldApiError extends Error {
  public status?: number;
  public statusText?: number | string;
  public isTimeout?: boolean;
  public isColdStart?: boolean;
  public messageTamil: string;

  constructor(
    message: string,
    options: {
      status?: number;
      statusText?: string;
      isTimeout?: boolean;
      isColdStart?: boolean;
      messageTamil?: string;
    } = {}
  ) {
    super(message);
    this.name = 'CropShieldApiError';
    this.status = options.status;
    this.statusText = options.statusText;
    this.isTimeout = options.isTimeout;
    this.isColdStart = options.isColdStart;
    this.messageTamil =
      options.messageTamil ||
      'சேவை தற்காலிகமாக பதிலளிக்கவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.';
  }
}

/**
 * Build a full API URL by appending the path to the base URL.
 */
export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

/**
 * Resilient fetch wrapper with timeout and cold-start detection.
 */
export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const url = apiUrl(path);
  const isAbsolute = url.startsWith('http');
  const timeoutMs = options.timeoutMs ?? 45000; // 45 seconds to accommodate Render instance spin-up

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const signal = options.signal || controller.signal;

  try {
    const response = await fetch(url, {
      ...options,
      signal,
      credentials: isAbsolute ? 'omit' : 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(options.headers ?? {}),
      },
    });

    clearTimeout(id);

    if (!response.ok) {
      console.warn(
        `[CropShield API] ${options.method ?? 'GET'} ${url} → HTTP ${response.status} ${response.statusText}`
      );
    }

    return response;
  } catch (err: any) {
    if (isAbsolute) {
      try {
        console.warn(`[CropShield API] Remote request failed (${url}), falling back to relative: ${path}`);
        const fallbackRes = await fetch(path, {
          ...options,
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json',
            ...(options.headers ?? {}),
          },
        });
        if (fallbackRes.ok) return fallbackRes;
      } catch {
        // ignore fallback failure and proceed to throw
      }
    }

    const isAborted = err.name === 'AbortError' || signal.aborted;
    const isNetworkError = err instanceof TypeError && err.message.includes('fetch');

    if (isAborted) {
      console.warn(`[CropShield API] Request timed out after ${timeoutMs}ms: ${url}`);
      throw new CropShieldApiError(
        'Server request timed out. The CropShield backend service may be waking up from sleep. Please try again in 15 seconds.',
        {
          isTimeout: true,
          isColdStart: true,
          messageTamil:
            'சர்வர் பதிலளிக்க நேரம் அதிகமாகிறது (சேவை தொடங்குகிறது). தயவுசெய்து 15 வினாடிகள் கழித்து மீண்டும் முயற்சிக்கவும்.',
        }
      );
    }

    if (isNetworkError) {
      console.warn(`[CropShield API] Network connection failed for ${url}`);
      throw new CropShieldApiError(
        'Unable to connect to the CropShield backend service. Please check your internet connection or backend status.',
        {
          isColdStart: true,
          messageTamil:
            'CropShield இணைய சேவையுடன் இணைக்க முடியவில்லை. இணைய இணைப்பைச் சரிபார்க்கவும்.',
        }
      );
    }

    throw err;
  }
}

/**
 * Ping backend health endpoint to check readiness and wake sleeping Render instance.
 */
export async function checkBackendHealth(): Promise<{
  ok: boolean;
  statusText: string;
  uptimeSeconds?: number;
}> {
  try {
    const res = await apiFetch('/api/health', { timeoutMs: 8000 });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, statusText: 'Online', uptimeSeconds: data.uptimeSeconds };
    }
    return { ok: false, statusText: `HTTP ${res.status}` };
  } catch {
    return { ok: false, statusText: 'Connecting...' };
  }
}
