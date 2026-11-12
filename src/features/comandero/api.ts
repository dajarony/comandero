import { apiClient } from '@/core/api/apiClient';
import type { CategoriaApi, MenuItemApi, PedidoApi, PedidoCreate } from '@/features/order/api/orderApi';
import type { Mesa } from '@/features/tables/types/TablesTypes';

export const ROUNDS_ENDPOINT = '/comandero/rondas';
type QueuedRound = { _offlineQueued: true; outboxId: string };
type ProductInput = Pick<MenuItemApi, 'nombre' | 'categoria_id' | 'disponible' | 'precio'>;

export const comanderoApi = {
  enviar: (data: PedidoCreate & { turno: number }) => apiClient.post<PedidoApi | QueuedRound>(ROUNDS_ENDPOINT, data),
  rondas: () => apiClient.get<PedidoApi[]>(ROUNDS_ENDPOINT),
  cerrar: (mesa: Mesa) => apiClient.post<Mesa>(`/comandero/mesas/${mesa.id}/cerrar`, { turno: mesa.turno }, false),
  crearMesa: (numero: string) => apiClient.post<Mesa>('/comandero/mesas', { numero }, false),
  crearCategoria: (nombre: string) => apiClient.post<CategoriaApi>('/comandero/categorias', { nombre }, false),
  crearProducto: (data: ProductInput) => apiClient.post<MenuItemApi>('/menu/items', data, false),
  actualizarProducto: (id: number, data: ProductInput) => apiClient.put<MenuItemApi>(`/menu/items/${id}`, data, false),
};
