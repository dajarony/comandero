/**
 * SUME DOCBLOCK
 * Nombre: Checkout Flow
 * Tipo: Logic Block
 *
 * Entradas: mesaId, número de personas para split
 * Acciones: calcula total, divide por personas, cierra mesa
 * Salidas: items resumen, total, cuotaPorPersona, handler cobrar
 * Errores: CHECKOUT_CLOSE_FAILED
 * Dependencias: orderStore, tablesStore, react-router-dom
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '@/features/order/state/orderStore';
import { useTablesStore } from '@/features/tables/state/tablesStore';
import { handleError } from '@/core/errors/errorHandler';
import type { MetodoPago } from '../types/CheckoutTypes';

export function useCheckoutFlow(mesaId: string) {
  // S — Setup
  const [numPersonas, setNumPersonas] = useState(1);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const navigate = useNavigate();

  const carrito = useOrderStore(s => s.getCarrito(mesaId));
  const total = useOrderStore(s => s.getTotal(mesaId));
  const clearCarrito = useOrderStore(s => s.clearCarrito);
  const liberarMesa = useTablesStore(s => s.liberarMesa);

  // M — Manage
  const cuotaPorPersona = numPersonas > 1 ? total / numPersonas : total;

  const itemsResumen = carrito.map(l => ({
    nombre: l.item.nombre,
    cantidad: l.cantidad,
    precioUnit: l.item.precio,
    emoji: l.item.emoji,
    subtotal: l.item.precio * l.cantidad,
  }));

  // U — Use
  const handleCobrar = () => {
    try {
      clearCarrito(mesaId);
      liberarMesa(mesaId);
      navigate('/mesas');
    } catch (error) {
      handleError(error, 'CHECKOUT_CLOSE_FAILED');
    }
  };

  // E — Error (gestionado en handleCobrar)

  return {
    itemsResumen,
    total,
    numPersonas,
    setNumPersonas,
    cuotaPorPersona,
    metodoPago,
    setMetodoPago,
    handleCobrar,
  };
}
