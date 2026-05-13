/**
 * @module useRegisterFlow
 * @description Hook de lógica de registro de nuevo restaurante
 * SUME Docblock v2.0
 * Entradas : nombre_restaurante, nombre_admin, email, password
 * Lógica   : Llama authApi.registrarRestaurante, guarda sesión, navega a /mesas
 * Salidas  : { fields, setters, error, loading, handleRegister }
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../state/authStore';
import { handleError } from '../../../core/errors/errorHandler';

export function useRegisterFlow() {
  const navigate = useNavigate();
  const { setSession } = useAuthStore();
  const [nombreRestaurante, setNombreRestaurante] = useState('');
  const [nombreAdmin, setNombreAdmin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const resp = await authApi.registrarRestaurante({
        nombre_restaurante: nombreRestaurante,
        nombre_admin: nombreAdmin,
        email,
        password,
      });
      setSession(resp.access_token, resp.usuario);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Error al crear el restaurante');
      handleError(err, 'Registro');
    } finally {
      setLoading(false);
    }
  };

  return {
    nombreRestaurante, setNombreRestaurante,
    nombreAdmin, setNombreAdmin,
    email, setEmail,
    password, setPassword,
    error, loading, handleRegister,
  };
}
