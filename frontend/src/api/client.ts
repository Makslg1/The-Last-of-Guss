const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  login: (username: string, password: string) =>
    apiRequest<{ token: string; user: { id: string; username: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: { username, password },
    }),

  logout: () => apiRequest('/auth/logout', { method: 'POST' }),

  getMe: () =>
    apiRequest<{ user: { id: string; username: string; role: string } }>('/auth/me'),

  getRounds: () =>
    apiRequest<Array<{ id: string; startAt: string; endAt: string; status: string }>>('/rounds'),

  createRound: () =>
    apiRequest<{ id: string; startAt: string; endAt: string }>('/rounds', { method: 'POST' }),

  getRound: (id: string) =>
    apiRequest<{
      id: string;
      startAt: string;
      endAt: string;
      status: string;
      totalPoints: number;
      myPoints: number;
      myTaps: number;
      winner?: { username: string; points: number };
    }>(`/rounds/${id}`),

  tap: (roundId: string) =>
    apiRequest<{ points: number; taps: number }>(`/rounds/${roundId}/tap`, { method: 'POST' }),
};
