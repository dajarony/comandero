/**
 * Router — Rutas con guardia de autenticacion
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthPage } from '@/features/auth/ui/AuthPage';
import { TablesPage } from '@/features/tables/ui/TablesPage';
import { OrderPageV2 } from '@/features/order/ui/OrderPageV2';
import { TicketPage } from '@/features/order/ui/TicketPage';
import { CheckoutPage } from '@/features/checkout/ui/CheckoutPage';
import { MenuIngestPage } from '@/features/menu-ingest/ui/MenuIngestPage';
import { ComandasPage } from '@/features/comandas/ui/ComandasPage';
import { DashboardPage } from '@/features/dashboard/ui/DashboardPage';
import { AuthGuard } from './AuthGuard';

export const router = createBrowserRouter([
  // Publica
  { path: '/login', element: <AuthPage /> },

  // Protegidas (requieren JWT)
  {
    element: <AuthGuard />,
    children: [
      { path: '/', element: <Navigate to="/mesas" replace /> },
      { path: '/mesas', element: <TablesPage /> },
      { path: '/comanda/:mesaId', element: <OrderPageV2 /> },
      { path: '/ticket/:pedidoId', element: <TicketPage /> },
      { path: '/cobro/:mesaId', element: <CheckoutPage /> },
      { path: '/admin/carta', element: <MenuIngestPage /> },
      { path: '/comandas', element: <ComandasPage /> },
      { path: '/historial', element: <DashboardPage /> },
    ],
  },

  // Fallback
  { path: '*', element: <Navigate to="/mesas" replace /> },
]);
