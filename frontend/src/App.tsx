import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.ts';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import ActivationPage from './pages/ActivationPage.tsx';
import OAuthCallbackPage from './pages/OAuthCallbackPage.tsx';
import ChatPage from './pages/ChatPage.tsx';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore(state => state.accessToken);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/activation/:email/:token" element={<ActivationPage />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
