// All business endpoints are versioned server-side (see backend main.ts); /health is the only
// exception and is never called through this client.
// NEXT_PUBLIC_* values are inlined into the client bundle at build time, so this cannot
// be read from the environment at runtime. The deployed API origin is therefore the
// production default: the host's dashboard variables are not reliably exposed to the
// build step, which silently left the localhost fallback compiled into the bundle.
// Override with NEXT_PUBLIC_API_URL when pointing at another API.
const DEFAULT_API_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://performly-ba9686e56.onrunxbuild.com'
    : 'http://localhost:3001';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL}/v1`;

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && retry && path !== '/auth/refresh') {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, options, false);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message ?? 'Une erreur est survenue.');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

async function requestFormData<T>(path: string, formData: FormData, retry = true): Promise<T> {
  const headers = new Headers();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  // No Content-Type here - the browser sets multipart/form-data with the right boundary itself.

  const res = await fetch(`${API_URL}${path}`, { method: 'POST', body: formData, headers, credentials: 'include' });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return requestFormData<T>(path, formData, false);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message ?? 'Une erreur est survenue.');
  }

  return res.json();
}

async function requestBlob(path: string, retry = true): Promise<{ blob: Blob; filename: string | null }> {
  const headers = new Headers();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(`${API_URL}${path}`, { headers, credentials: 'include' });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return requestBlob(path, false);
  }

  if (!res.ok) {
    throw new ApiError(res.status, "Le téléchargement a échoué.");
  }

  const disposition = res.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="?([^"]+)"?/);
  return { blob: await res.blob(), filename: match?.[1] ?? null };
}

/** Downloads a binary export (xlsx/pdf) and saves it via the browser, honoring the server's filename. */
export async function downloadFile(path: string, fallbackFilename: string) {
  const { blob, filename } = await requestBlob(path);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? fallbackFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  postFormData: <T>(path: string, formData: FormData) => requestFormData<T>(path, formData),
};

export { tryRefresh };
