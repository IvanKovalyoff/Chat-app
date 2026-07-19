import axios from 'axios';

// In dev, Vite proxies /auth/* to the backend (see vite.config.ts).
// In production, VITE_API_URL must point directly at the backend origin.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/',
  withCredentials: true, // needed for the refreshToken cookie
});

export type AuthResponse = {
  user: { id: string; email: string; username: string };
  accessToken: string;
};

export const authApi = {
  register: (email: string, username: string, password: string) =>
    api.post('/auth/register', { email, username, password }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  refresh: () => api.post<AuthResponse>('/auth/refresh'),
};
