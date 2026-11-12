import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/state/authStore';

export function ProductPage({ service, tpv }: { service?: ReactNode; tpv?: ReactNode }) {
  const user = useAuthStore(state => state.usuario);
  const page = user?.modo === 'COMANDERO' ? service : tpv;
  return page ?? <Navigate to="/" replace />;
}

export function FloorGuard() {
  const user = useAuthStore(state => state.usuario);
  return user?.modo === 'COMANDERO' && user.rol === 'COCINA' ? <Navigate to="/cocina" replace /> : <Outlet />;
}
