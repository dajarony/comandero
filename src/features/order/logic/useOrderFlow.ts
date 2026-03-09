/**
 * SUME DOCBLOCK
 * Nombre: Order Flow
 * Tipo: Logic Block
 *
 * Entradas: mesaId (params), categoría activa, tap item
 * Acciones: filtra menú por categoría, gestiona carrito, envía pedido
 * Salidas: items filtrados, carrito, total, handlers
 * Errores: ORDER_SEND_FAILED
 * Dependencias: orderStore, tablesStore, orderApi, react-router-dom
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MENU_MOCK, CATEGORIAS } from '../api/orderApi';
import { useOrderStore } from '../state/orderStore';
import { useTablesStore } from '@/features/tables/state/tablesStore';
import type { Categoria, MenuItem } from '../types/OrderTypes';
import { handleError } from '@/core/errors/errorHandler';

export function useOrderFlow(mesaId: string) {
  // S — Setup
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria>('Bebidas');
  const [carritoVisible, setCarritoVisible] = useState(false);
  const navigate = useNavigate();

  const { addItem, removeItem, getCarrito, getTotal } = useOrderStore();
  const abrirMesa = useTablesStore(s => s.abrirMesa);
  const setMesaEstado = useTablesStore(s => s.setMesaEstado);

  const carrito = getCarrito(mesaId);
  const total = getTotal(mesaId);
  const itemsCategoria = MENU_MOCK.filter(i => i.categoria === categoriaActiva);

  // U — Use
  const handleMarcharPedido = () => {
    try {
      if (carrito.length === 0) return;
      abrirMesa(mesaId);
      setMesaEstado(mesaId, 'OCUPADA', { totalCuenta: total });
      navigate('/mesas');
    } catch (error) {
      handleError(error, 'ORDER_SEND_FAILED');
    }
  };

  // M — Manage
  const handleAddItem = (item: MenuItem) => addItem(mesaId, item);
  const handleRemoveItem = (itemId: string) => removeItem(mesaId, itemId);
  const getCantidadItem = (itemId: string) =>
    carrito.find(l => l.item.id === itemId)?.cantidad ?? 0;

  return {
    categorias: CATEGORIAS,
    categoriaActiva,
    setCategoriaActiva,
    itemsCategoria,
    carrito,
    total,
    carritoVisible,
    setCarritoVisible,
    handleAddItem,
    handleRemoveItem,
    handleMarcharPedido,
    getCantidadItem,
  };
}
