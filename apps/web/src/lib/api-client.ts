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

  const json = await response.json();

  if (!response.ok || json.success === false) {
    const errorJson = json as ApiErrorResponse;
    throw new ApiClientError(
      errorJson.error?.code || 'UNKNOWN_ERROR',
      errorJson.error?.message || 'An unexpected API error occurred',
      errorJson.error?.details
    );
  }

  const successJson = json as ApiResponse<T>;
  return successJson.data;
}
