/**
 * useAuthFlow — Lógica de autenticación
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../state/authStore';

export function useAuthFlow() {
  const navigate = useNavigate();
  const { setSession } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const resp = await authApi.login({ email, password });
      setSession(resp.access_token, resp.usuario);
      navigate('/mesas', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, password, setPassword, error, loading, handleLogin };
}
