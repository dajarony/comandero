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
  const [pedidos, setPedidos]       = useState<PedidoApi[]>([]);
  const [selected, setSelected]     = useState<Set<number>>(new Set());
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [descuento, setDescuento]   = useState<number>(0);
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(0);
  const [loading, setLoading]       = useState(true);
  const [cobrando, setCobrando]     = useState(false);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  // Propina: guardamos % y valor custom por separado
  // propina se calcula al vuelo sobre totalConDescuento → nunca queda stale
  const [propinaPercent, setPropinaPercent]   = useState<number>(0);   // 0 | 10 | 15 | 20
  const [propinaCustom, setPropinaCustomState] = useState<number>(0);
  const [isCustomPropina, setIsCustomPropina] = useState(false);

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
      if (next.has(pedidoId)) {
        next.delete(pedidoId);
      } else {
        next.add(pedidoId);
      }
      return next;
    });
  }, []);

  const selectAll  = useCallback(() => setSelected(new Set(pedidos.map(p => p.id))), [pedidos]);
  const selectNone = useCallback(() => setSelected(new Set()), []);

  // ── Cálculos derivados ──────────────────────────────────────
  const subtotal          = pedidos.filter(p => selected.has(p.id)).reduce((s, p) => s + p.total, 0);
  const totalGeneral      = pedidos.reduce((s, p) => s + p.total, 0);
  const allSelected       = selected.size === pedidos.length && pedidos.length > 0;
  const totalConDescuento = Math.max(subtotal - descuento, 0);

  // Propina calculada al vuelo: si % → aplica sobre totalConDescuento; si custom → valor directo
  const propina       = isCustomPropina
    ? propinaCustom
    : Math.round(totalConDescuento * propinaPercent) / 100;
  const totalConPropina = totalConDescuento + propina;

  // Exponer setters limpios
  const setPropinaPct = (pct: number) => {
    setIsCustomPropina(false);
    setPropinaPercent(pct);
  };
  const setPropinaCustom = (val: number) => {
    setIsCustomPropina(true);
    setPropinaCustomState(val);
  };

  const cambio = metodoPago === 'EFECTIVO' && efectivoRecibido > totalConPropina
    ? efectivoRecibido - totalConPropina
    : 0;

  // ── Cobrar ──────────────────────────────────────────────────
  const handleCobrar = async () => {
    if (selected.size === 0) return;
    try {
      setCobrando(true);
      const ids = Array.from(selected);
      for (let i = 0; i < ids.length; i++) {
        const propinaPedido = i === 0 ? propina : 0;
        const descuentoPedido = i === 0 ? descuento : 0;
        await orderApi.cerrarPedido(ids[i], propinaPedido, metodoPago, descuentoPedido);
      }
      if (allSelected) {
        await tablesApi.liberarMesa(Number(mesaId));
      } else {
        await tablesApi.cambiarEstado(Number(mesaId), 'OCUPADA');
      }
      navigate('/mesas');
    } catch (error) {
      handleError(error, 'CHECKOUT_CLOSE_FAILED');
      setErrorMsg(error instanceof Error ? error.message : 'Error al cobrar');
    } finally {
      setCobrando(false);
    }
  };

  const handleLiberar = async () => {
    try {
      setCobrando(true);
      await tablesApi.liberarMesa(Number(mesaId));
      navigate('/mesas');
    } catch (error) {
      handleError(error, 'CHECKOUT_LIBERAR_FAILED');
      setErrorMsg(error instanceof Error ? error.message : 'Error al liberar mesa');
    } finally {
      setCobrando(false);
    }
  };

  return {
    pedidos, selected, toggleSelect, selectAll, selectNone,
    subtotal, totalGeneral, allSelected,
    descuento, setDescuento,
    propinaPercent, isCustomPropina, propinaCustom,
    setPropinaPct, setPropinaCustom,
    propina, totalConDescuento, totalConPropina,
    metodoPago, setMetodoPago,
    efectivoRecibido, setEfectivoRecibido, cambio,
    handleCobrar, handleLiberar,
    loading, cobrando, errorMsg,
  };
}
