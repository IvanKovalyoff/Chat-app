import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi.ts';
import { useAuthStore } from '../store/authStore.ts';
import { socket } from '../socket.ts';

export default function ActivationPage() {
  const { email, token } = useParams<{ email: string; token: string }>();
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    async function activate() {
      try {
        if (!email || !token) throw new Error('Missing activation params');
        const { data } = await authApi.activate(email, token);
        setAuth(data.user, data.accessToken);
        socket.connect();
        navigate('/');
      } catch {
        setStatus('error');
      }
    }

    activate();
  }, [email, token, navigate, setAuth]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400 text-sm animate-pulse">
          Activating your account…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
        <div className="text-4xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-white mb-2">Invalid link</h2>
        <p className="text-gray-400 text-sm">
          This activation link is invalid or has already been used.
        </p>
      </div>
    </div>
  );
}
