/**
 * @module useComandasFlow
 * @description Lógica de Comandas Abiertas — Nivel 1
 * SUME Docblock v2.0
 * Entradas : tablesApi, orderApi
 * Lógica   : carga mesas activas, calcula tiempos, auto-refresh 30s
 * Salidas  : mesasConPedidos, actions, loading, error
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tablesApi } from '@/features/tables/api/tablesApi';
import { orderApi } from '@/features/order/api/orderApi';
import type { Mesa } from '@/features/tables/types/TablesTypes';
import type { PedidoApi } from '@/features/order/api/orderApi';

export interface MesaConPedidos {
  mesa: Mesa;
  pedidos: PedidoApi[];
}

interface ComandasFlowResult {
  mesasConPedidos: MesaConPedidos[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  handleTapCobrar: (mesaId: number) => void;
  handleTapAddOrder: (mesaId: number) => void;
  handleMarcharPedido: (pedidoId: number) => Promise<void>;
  handleUpdateNota: (mesaId: number, nota: string | null) => Promise<void>;
  handleAddToPersona: (mesaId: number, pedidoId: number) => void;
  handleMarcharDestino: (pedidoId: number, destino: string) => Promise<void>;
  handleRetenerPedido: (pedidoId: number) => Promise<void>;
  handleLiberarPedido: (pedidoId: number) => Promise<void>;
  handlePrintTicket: (pedidoId: number) => Promise<string>;
}

const ESTADOS_ACTIVOS: Mesa['estado'][] = ['OCUPADA', 'PENDIENTE_COBRO'];

export function useComandasFlow(): ComandasFlowResult {
  const [mesasConPedidos, setMesasConPedidos] = useState<MesaConPedidos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      setError(null);
      const todasMesas = await tablesApi.fetchMesas();
      const mesasActivas = todasMesas.filter(m =>
        ESTADOS_ACTIVOS.includes(m.estado)
      );

      const resultados = await Promise.all(
        mesasActivas.map(async (mesa): Promise<MesaConPedidos> => {
          try {
            const todos = await orderApi.pedidosPorMesa(mesa.id);
            const pedidos = todos.filter(p => p.estado !== 'CERRADO');
            return { mesa, pedidos };
          } catch {
            return { mesa, pedidos: [] };
          }
        })
      );

      setMesasConPedidos(resultados.filter(r => r.pedidos.length > 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar comandas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const handleTapCobrar = (mesaId: number) => navigate(`/cobro/${mesaId}`);
  const handleTapAddOrder = (mesaId: number) => navigate(`/comanda/${mesaId}`);
  const handleAddToPersona = (mesaId: number, pedidoId: number) =>
    navigate(`/comanda/${mesaId}?pedido=${pedidoId}`);

  const handleMarcharPedido = async (pedidoId: number) => {
    await orderApi.marcharPedido(pedidoId);
    await load();
  };

  const handleUpdateNota = async (mesaId: number, nota: string | null) => {
    await tablesApi.actualizarNota(mesaId, nota);
    await load();
  };

  const handleMarcharDestino = async (pedidoId: number, destino: string) => {
    try { await orderApi.marcharPedidoDestino(pedidoId, destino); }
    catch { /* estado desactualizado */ }
    await load();
  };

  const handleRetenerPedido = async (pedidoId: number) => {
    try { await orderApi.retenerPedido(pedidoId); }
    catch { /* estado desactualizado */ }
    await load();
  };

  const handleLiberarPedido = async (pedidoId: number) => {
    try { await orderApi.liberarPedido(pedidoId); }
    catch { /* estado desactualizado */ }
    await load();
  };

  const handlePrintTicket = async (pedidoId: number): Promise<string> => {
    return orderApi.fetchTicketTexto(pedidoId);
  };

  return {
    mesasConPedidos, loading, error,
    refresh: load,
    handleTapCobrar, handleTapAddOrder,
    handleMarcharPedido, handleUpdateNota,
    handleMarcharDestino, handleRetenerPedido,
    handleLiberarPedido, handlePrintTicket,
    handleAddToPersona,
  };
}
