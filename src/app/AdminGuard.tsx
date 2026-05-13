import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/state/authStore';

/**
 * @module AdminGuard
 * @description Protege rutas que requieren privilegios de ADMIN.
 * Si el usuario no es ADMIN, redirige al dashboard principal (mesas).
 */
export function AdminGuard() {
  const { usuario, isAuthenticated } = useAuthStore();

  // Si no está autenticado, el AuthGuard superior ya lo redirigirá a /login.
  // Pero por seguridad, manejamos el caso aquí también.
  if (!isAuthenticated || !usuario) {
    return <Navigate to="/login" replace />;
  }

  // Si no es ADMIN, redirigir a la pantalla de servicio (mesas)
  if (usuario.rol !== 'ADMIN') {
    return <Navigate to="/mesas" replace />;
  }

  return <Outlet />;
}
