import { createBrowserRouter, Navigate } from 'react-router-dom';
import { FloorGuard, ProductPage } from './ProductPage';
import { ServiceTablesPage } from '@/features/comandero/ServiceTablesPage';
import { ServiceOrderPage } from '@/features/comandero/ServiceOrderPage';
import { ServiceRoundsPage } from '@/features/comandero/ServiceRoundsPage';
import { ServiceMenuPage } from '@/features/comandero/ServiceMenuPage';
import { PrinterPage } from '@/features/comandero/PrinterPage';
import { AuthPage } from '../features/auth/ui/AuthPage';
import { RegisterPage } from '../features/auth/ui/RegisterPage';
import { TablesPage } from '../features/tables/ui/TablesPage';
import { OrderPageV2 } from '../features/order/ui/OrderPageV2';
import { TicketPage } from '../features/order/ui/TicketPage';
import { CheckoutPage } from '../features/checkout/ui/CheckoutPage';
import { MenuIngestPage } from '../features/menu-ingest/ui/MenuIngestPage';
import { StatsDashboard } from '../features/dashboard/ui/StatsDashboard';
import { KitchenPage } from '../features/kitchen/ui/KitchenPage';
import { ComandasPage } from '../features/comandas/ui/ComandasPage';
import { AdminGuard } from './AdminGuard';
import { AuthGuard } from './AuthGuard';
import { RoleRedirect } from './RoleRedirect';
import { UsersPage } from '../features/users/ui/UsersPage';
import { SettingsPage } from '../features/settings/ui/SettingsPage';
import { OrderHistoryPage } from '../features/dashboard/ui/OrderHistoryPage';
import { PublicMenuPage } from '../features/public-menu/ui/PublicMenuPage';
import { GastosPage } from '../features/gastos/ui/GastosPage';
import { IAChatPage } from '../features/ia/ui/IAChatPage';

export const router = createBrowserRouter([
  // Publica
  { path: '/login', element: <AuthPage /> },
  { path: '/registro', element: <RegisterPage /> },
  { path: '/menu/:restauranteId', element: <PublicMenuPage /> },

  // Protegidas (requieren JWT)
  {
    element: <AuthGuard />,
    children: [
      { path: '/', element: <RoleRedirect /> },
      { element: <FloorGuard />, children: [
        { path: '/mesas', element: <ProductPage service={<ServiceTablesPage />} tpv={<TablesPage />} /> },
        { path: '/comandas', element: <ProductPage service={<ServiceRoundsPage />} tpv={<ComandasPage />} /> },
        { path: '/comanda/:mesaId', element: <ProductPage service={<ServiceOrderPage />} tpv={<OrderPageV2 />} /> },
        { path: '/impresora', element: <ProductPage service={<PrinterPage />} /> },
      ] },
      { path: '/ticket/:pedidoId', element: <ProductPage tpv={<TicketPage />} /> },
      { path: '/cobro/:mesaId', element: <ProductPage tpv={<CheckoutPage />} /> },
      { path: '/cocina', element: <KitchenPage /> },

      // Rutas solo para ADMIN
      {
        element: <AdminGuard />,
        children: [
          { path: '/admin/carta', element: <ProductPage service={<ServiceMenuPage />} tpv={<MenuIngestPage />} /> },
          { path: '/configuracion', element: <SettingsPage /> },
          { path: '/stats', element: <ProductPage tpv={<StatsDashboard />} /> },
          { path: '/usuarios', element: <UsersPage /> },
          { path: '/historial', element: <ProductPage tpv={<OrderHistoryPage />} /> },
          { path: '/gastos', element: <ProductPage tpv={<GastosPage />} /> },
          { path: '/asistente', element: <ProductPage tpv={<IAChatPage />} /> },
        ],
      },
    ],
  },

  // Fallback
  { path: '*', element: <Navigate to="/mesas" replace /> },
]);
