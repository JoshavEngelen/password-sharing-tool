const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type RequestOptions = Omit<RequestInit, 'method' | 'body'>

const defaultHeaders: Record<string, string> = {}

export function setDefaultHeader(key: string, value: string): void {
  defaultHeaders[key] = value
}

export function removeDefaultHeader(key: string): void {
  delete defaultHeaders[key]
}

async function request<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

  const hasBody = body !== undefined
  const contentHeaders: Record<string, string> = hasBody
    ? { 'Content-Type': 'application/json' }
    : {}

  const response = await fetch(url, {
    ...options,
    method,
    headers: {
      ...defaultHeaders,
      ...contentHeaders,
      ...(options?.headers as Record<string, string> | undefined ?? {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new ApiError(
      response.status,
      errorText || `Request failed with status ${response.status}`,
    )
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return (await response.json()) as T
  }

  // Caller must use `apiClient.get<string>` when expecting plain text
  return (await response.text()) as unknown as T
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, 'GET', undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, 'POST', body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, 'PUT', body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, 'PATCH', body, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, 'DELETE', undefined, options),
}
