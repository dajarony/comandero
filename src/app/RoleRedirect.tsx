/**
 * @module RoleRedirect
 * @description Redirige al usuario a la ruta inicial según su rol.
 * - COCINA  → /cocina  (KDS)
 * - ADMIN   → /mesas
 * - CAMARERO → /mesas
 */
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/state/authStore';

export function RoleRedirect() {
  const { usuario } = useAuthStore();
  if (usuario?.rol === 'COCINA') return <Navigate to="/cocina" replace />;
  return <Navigate to="/mesas" replace />;
}
