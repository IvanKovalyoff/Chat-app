import axios from 'axios';

// In dev, Vite proxies /auth/* to the backend (see vite.config.ts).
// In production, VITE_API_URL must point directly at the backend origin.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true, // needed for the refreshToken cookie
});

export type AuthResponse = {
  user: { id: string; email: string; username: string };
  accessToken: string;
};

export type RegisterResponse = {
  user: { id: string; email: string; username: string };
  // Present only when the activation email could not be delivered (e.g. no
  // verified sending domain configured yet) — lets the UI offer an
  // instant-activate fallback instead of leaving the user stuck.
  activationLink?: string;
};

export const authApi = {
  register: (email: string, username: string, password: string) =>
    api.post<RegisterResponse>('/auth/register', {
      email,
      username,
      password,
    }),

  activate: (email: string, token: string) =>
    api.get<AuthResponse>(
      `/auth/activation/${encodeURIComponent(email)}/${encodeURIComponent(token)}`,
    ),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  refresh: () => api.post<AuthResponse>('/auth/refresh'),
};
