/**
 * @module AuthGuard
 * @description Protege rutas que requieren JWT — redirige a /login si no hay sesión
 */
import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/state/authStore';
import { authApi } from '@/features/auth/api/authApi';
import { syncManager } from '@/core/api/syncManager';
import { useAppSocket } from '@/shared/hooks/useAppSocket';
import { BottomNav } from '@/shared/components/BottomNav';
import { ApiError } from '@/core/api/apiClient';

export function AuthGuard() {
    const { isAuthenticated, loadFromStorage, setSession, logout } = useAuthStore();
    const [initializing, setInitializing] = useState(true);

    // 1. Activar WebSocket Global (Solo si hay sesión)
    useAppSocket();

    useEffect(() => {
        let cancelled = false;

        async function initializeSession() {
            loadFromStorage();
            const token = localStorage.getItem('comandero_token');

            if (!token) {
                if (!cancelled) setInitializing(false);
                return;
            }

            try {
                const usuario = await authApi.getMe();
                if (!cancelled) {
                    setSession(token, usuario);
                    syncManager.initializeSyncListeners();
                }
            } catch (error) {
                const rejected = error instanceof ApiError && (error.status === 401 || error.status === 403);
                if (!cancelled && (rejected || !useAuthStore.getState().usuario?.modo)) {
                    logout();
                }
            } finally {
                if (!cancelled) setInitializing(false);
            }
        }

        initializeSession();

        return () => {
            cancelled = true;
        };
    }, [loadFromStorage, logout, setSession]);

    if (initializing) return null;

    const token = localStorage.getItem('comandero_token');
    if (!token || !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, paddingBottom: '72px' }}>
                <Outlet />
            </div>
            <BottomNav />
        </div>
    );
}
