/**
 * Order API — Conecta con backend real para menú y pedidos
 */
import { apiClient } from '@/core/api/apiClient';

/** Categoría del menú (matching backend) */
export interface CategoriaApi {
  id: number;
  nombre: string;
  emoji: string;
  orden: number;
}

/** Item del menú (matching backend) */
export interface MenuItemApi {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  emoji: string;
  disponible: boolean;
  categoria_id: number;
  categoria_nombre: string | null;
}

/** Línea de pedido para crear (campo 'nota' singular = backend) */
export interface LineaPedidoCreate {
  item_menu_id: number;
  cantidad: number;
  nota: string;
}

/** Payload para crear pedido */
export interface PedidoCreate {
  mesa_id: number;
  lineas: LineaPedidoCreate[];
}

/** Respuesta de pedido */
export interface PedidoApi {
  id: number;
  mesa_id: number;
  usuario_id: number;
  estado: string;
  destino?: string | null;
  total: number;
  created_at: string;
  lineas: Array<{
    id: number;
    item_menu_id: number;
    item_nombre: string;
    item_emoji: string;
    cantidad: number;
    precio_unitario: number;
    nota: string;
  }>;
}

export const orderApi = {
  /** Lista categorías del menú */
  fetchCategorias: (): Promise<CategoriaApi[]> =>
    apiClient.get<CategoriaApi[]>('/menu/categorias'),

  /** Lista items del menú (opcionalmente filtrados por categoría) */
  fetchItems: (categoriaId?: number): Promise<MenuItemApi[]> => {
    const params = categoriaId ? `?categoria_id=${categoriaId}` : '';
    return apiClient.get<MenuItemApi[]>(`/menu/items${params}`);
  },

  /** Crea un pedido con líneas */
  crearPedido: (data: PedidoCreate): Promise<PedidoApi> =>
    apiClient.post<PedidoApi>('/pedidos', data),

  /** Marchar pedido (enviar a cocina) */
  marcharPedido: (pedidoId: number): Promise<PedidoApi> =>
    apiClient.put<PedidoApi>(`/pedidos/${pedidoId}/marchar`),

  /** Cerrar pedido (cobrado) */
  cerrarPedido: (pedidoId: number): Promise<PedidoApi> =>
    apiClient.put<PedidoApi>(`/pedidos/${pedidoId}/cerrar`),

  /** Lista pedidos de una mesa */
  pedidosPorMesa: (mesaId: number): Promise<PedidoApi[]> =>
    apiClient.get<PedidoApi[]>(`/pedidos/mesa/${mesaId}`),

  /** Obtiene un pedido por ID */
  fetchPedido: (pedidoId: number): Promise<PedidoApi> =>
    apiClient.get<PedidoApi>(`/pedidos/${pedidoId}`),

  /** Obtiene ticket texto plano para impresora termica */
  fetchTicketTexto: async (pedidoId: number): Promise<string> => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const token = localStorage.getItem('comandero_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}/pedidos/${pedidoId}/ticket`, { headers });
    if (!res.ok) throw new Error('Error al obtener ticket');
    return res.text();
  },

  /** Retener pedido (ABIERTO → RETENIDO) */
  retenerPedido: (pedidoId: number): Promise<PedidoApi> =>
    apiClient.put<PedidoApi>(`/pedidos/${pedidoId}/retener`),

  /** Liberar pedido retenido (RETENIDO → ABIERTO) */
  liberarPedido: (pedidoId: number): Promise<PedidoApi> =>
    apiClient.put<PedidoApi>(`/pedidos/${pedidoId}/liberar`),

  /** Marchar pedido con destino (COCINA o BARRA) */
  marcharPedidoDestino: (pedidoId: number, destino: string): Promise<PedidoApi> =>
    apiClient.put<PedidoApi>(`/pedidos/${pedidoId}/marchar?destino=${destino}`),

  /** Añadir líneas a un pedido existente (continuar persona) */
  agregarLineas: (pedidoId: number, lineas: LineaPedidoCreate[]): Promise<PedidoApi> =>
    apiClient.post<PedidoApi>(`/pedidos/${pedidoId}/lineas`, { lineas }),
};
