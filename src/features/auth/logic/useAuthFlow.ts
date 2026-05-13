/**
 * @module useAuthFlow
 * @description Hook de lógica de login (formulario + llamada API + navegación)
 * SUME Docblock v2.0
 * Entradas : email y password del formulario
 * Lógica   : Valida, llama authApi.login, guarda sesión, navega a /mesas
 * Salidas  : { email, password, error, loading, handleLogin }
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../state/authStore';
import { handleError } from '../../../core/errors/errorHandler';

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
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Credenciales incorrectas');
      handleError(err, 'Login');
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, password, setPassword, error, loading, handleLogin };
}
