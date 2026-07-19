import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { authApi } from './api/authApi.ts';
import { useAuthStore } from './store/authStore.ts';
import './index.css';

// On every page load, try to restore the session using the httpOnly cookie.
// If it fails (cookie missing or expired) we just stay logged out silently.
async function bootstrap() {
  try {
    const { data } = await authApi.refresh();
    useAuthStore.getState().setAuth(data.user, data.accessToken);
  } catch {
    // no valid session — user will be sent to /login by ProtectedRoute
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}

bootstrap();
