/**
 * AuthGuard — Protege rutas que requieren autenticación.
 * Si no hay token, redirige a /login.
 * Carga la sesión desde localStorage al montar.
 *
 * FIX: estado `initializing` evita race condition en primer render:
 * el store arranca con isAuthenticated=false aunque haya token en
 * localStorage porque loadFromStorage() es asíncrono (useEffect).
 * Mientras initializing===true devolvemos null para no redirigir
 * antes de que el store esté hidratado.
 */
import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/state/authStore';

export function AuthGuard() {
    const { isAuthenticated, loadFromStorage } = useAuthStore();
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        loadFromStorage();
        setInitializing(false);
    }, [loadFromStorage]);

    // Esperar hidratación del store antes de tomar decisiones de routing
    if (initializing) return null;

    // Después de hidratar, si no hay sesión → login
    const token = localStorage.getItem('comandero_token');
    if (!token && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
