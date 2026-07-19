import { io } from 'socket.io-client';
import { useAuthStore } from './store/authStore.ts';

// Points directly at the backend origin — not proxied, since Socket.IO
// uses WebSockets which Vite's proxy doesn't forward
export const socket = io(
  import.meta.env.VITE_API_URL ||
    'http://backend-production-f5bd.up.railway.app',
  {
    autoConnect: false, // we connect manually after login
    auth: cb => {
      // Called on every (re)connect — always sends the freshest token
      cb({ token: useAuthStore.getState().accessToken });
    },
  },
);
