import { create } from 'zustand';

type User = {
  id: string;
  email: string;
  username: string;
};

type AuthStore = {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthStore>(set => ({
  user: null,
  accessToken: null,

  setAuth: (user, accessToken) => set({ user, accessToken }),

  clearAuth: () => set({ user: null, accessToken: null }),
}));
