/**
 * @module useCheckoutFlow
 * @description Cobro con selección de comandas individuales — split billing
 * SUME Docblock v2.0
 * Entradas : mesaId (URL param)
 * Lógica   : carga pedidos activos, permite seleccionar cuáles cobrar
 * Salidas  : pedidos, selected, total, handleCobrar, toggleSelect
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '@/features/order/api/orderApi';
import { tablesApi } from '@/features/tables/api/tablesApi';
import { handleError } from '@/core/errors/errorHandler';
import type { PedidoApi } from '@/features/order/api/orderApi';
import type { MetodoPago } from '../types/CheckoutTypes';

export function useCheckoutFlow(mesaId: string) {
  const [pedidos, setPedidos] = useState<PedidoApi[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [loading, setLoading] = useState(true);
  const [cobrando, setCobrando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    orderApi.pedidosPorMesa(Number(mesaId))
      .then(data => {
        const activos = data.filter(p => p.estado !== 'CERRADO');
        setPedidos(activos);
        setSelected(new Set(activos.map(p => p.id)));
      })
      .catch(err => {
        handleError(err, 'CHECKOUT_LOAD_FAILED');
        setErrorMsg('No se pudo cargar la cuenta');
      })
      .finally(() => setLoading(false));
  }, [mesaId]);

  const toggleSelect = useCallback((pedidoId: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(pedidoId) ? next.delete(pedidoId) : next.add(pedidoId);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(pedidos.map(p => p.id)));
  }, [pedidos]);

  const selectNone = useCallback(() => setSelected(new Set()), []);

  const totalSelected = pedidos
    .filter(p => selected.has(p.id))
    .reduce((sum, p) => sum + p.total, 0);

  const totalGeneral = pedidos.reduce((sum, p) => sum + p.total, 0);
  const allSelected = selected.size === pedidos.length && pedidos.length > 0;

  const handleCobrar = async () => {
    if (selected.size === 0) return;
    try {
      setCobrando(true);
      for (const pedidoId of selected) {
        await orderApi.cerrarPedido(pedidoId);
      }
      if (allSelected) {
        await tablesApi.liberarMesa(Number(mesaId));
      }
      navigate('/mesas');
    } catch (error) {
      handleError(error, 'CHECKOUT_CLOSE_FAILED');
      setErrorMsg(error instanceof Error ? error.message : 'Error al cobrar');
    } finally {
      setCobrando(false);
    }
  };

  return {
    pedidos, selected, toggleSelect, selectAll, selectNone,
    totalSelected, totalGeneral, allSelected,
    metodoPago, setMetodoPago, handleCobrar,
    loading, cobrando, errorMsg,
  };
}
