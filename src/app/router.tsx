import { createBrowserRouter, Navigate } from 'react-router-dom';
import { TablesPage } from '@/features/tables/ui/TablesPage';
import { OrderPage } from '@/features/order/ui/OrderPage';
import { CheckoutPage } from '@/features/checkout/ui/CheckoutPage';
import { MenuIngestPage } from '@/features/menu-ingest/ui/MenuIngestPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/mesas" replace /> },
  { path: '/mesas', element: <TablesPage /> },
  { path: '/comanda/:mesaId', element: <OrderPage /> },
  { path: '/cobro/:mesaId', element: <CheckoutPage /> },
  { path: '/admin/carta', element: <MenuIngestPage /> },
  // BottomNav stub routes — show TablesPage as fallback for now
  { path: '/comandas', element: <TablesPage /> },
  { path: '/historial', element: <TablesPage /> },
  { path: '*', element: <Navigate to="/mesas" replace /> },
]);
