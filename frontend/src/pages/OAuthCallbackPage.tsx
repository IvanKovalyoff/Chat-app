import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.ts';
import { socket } from '../socket.ts';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  const [searchParams] = useSearchParams();

  const accessToken = searchParams.get('accessToken');
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');
  const username = searchParams.get('username');

  useEffect(() => {
    if (accessToken && userId && email && username) {
      setAuth({ id: userId, email, username }, accessToken);
      socket.connect();
      navigate('/', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate, setAuth, accessToken, userId, email, username]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <p className="text-gray-400 text-sm animate-pulse">Signing you in…</p>
    </div>
  );
}
