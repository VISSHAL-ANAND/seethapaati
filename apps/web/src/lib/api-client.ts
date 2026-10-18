import { ApiResponse, ApiErrorResponse } from '@seethapaati/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Include HttpOnly auth cookies
  });

  const contentType = response.headers.get('content-type') || '';
  let json: any = null;

  if (contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  } else {
    const text = await response.text();
    if (!response.ok) {
      throw new ApiClientError(
        `HTTP_${response.status}`,
        text || `Request failed with HTTP status ${response.status}`
      );
    }
    return (text as unknown) as T;
  }

  if (!response.ok || (json && json.success === false)) {
    const errorJson = json as ApiErrorResponse | null;
    throw new ApiClientError(
      errorJson?.error?.code || `HTTP_${response.status}`,
      errorJson?.error?.message || `Request failed with status ${response.status}`,
      errorJson?.error?.details
    );
  }

  const successJson = json as ApiResponse<T>;
  return successJson?.data !== undefined ? successJson.data : (json as T);
}
