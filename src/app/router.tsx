import { createBrowserRouter, Navigate } from 'react-router-dom';
import { TablesPage } from '@/features/tables/ui/TablesPage';
import { OrderPageV2 } from '@/features/order/ui/OrderPageV2';
import { CheckoutPage } from '@/features/checkout/ui/CheckoutPage';
import { MenuIngestPage } from '@/features/menu-ingest/ui/MenuIngestPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/mesas" replace /> },
  { path: '/mesas', element: <TablesPage /> },
  { path: '/comanda/:mesaId', element: <OrderPageV2 /> },
  { path: '/cobro/:mesaId', element: <CheckoutPage /> },
  { path: '/admin/carta', element: <MenuIngestPage /> },
  { path: '/comandas', element: <TablesPage /> },
  { path: '/historial', element: <TablesPage /> },
  { path: '*', element: <Navigate to="/mesas" replace /> },
]);
