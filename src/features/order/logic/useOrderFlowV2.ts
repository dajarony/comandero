// src/features/order/logic/useOrderFlowV2.ts
/**
 * SUME DOCBLOCK
 * Nombre: Order Flow V2
 * Tipo: Logic Block
 * Entradas: mesaId, bloque activo, subcategoria activa, item seleccionado
 * Acciones: navega 3 niveles, gestiona modal, añade al carrito con modificadores
 * Salidas: estado de navegación, items filtrados, carrito, handlers
 * Errores: ORDER_V2_FAILED
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BLOQUES_MOCK, MENU_MOCK_V2 } from '../api/menuMockV2';
import { useOrderStoreV2 } from '../state/orderStoreV2';
import { useTablesStore } from '@/features/tables/state/tablesStore';
import type { Bloque, MenuItemV2, ModificadorSeleccionado, Subcategoria } from '../types/OrderTypesV2';

type Nivel = 'bloques' | 'subcategorias' | 'items';

export function useOrderFlowV2(mesaId: string) {
  // S — Setup
  const [nivel, setNivel] = useState<Nivel>('bloques');
  const [bloqueActivo, setBloqueActivo] = useState<Bloque | null>(null);
  const [subcatActiva, setSubcatActiva] = useState<Subcategoria | null>(null);
  const [itemModal, setItemModal] = useState<MenuItemV2 | null>(null);
  const [carritoVisible, setCarritoVisible] = useState(false);
  const navigate = useNavigate();

  const { addLineaV2, getCarritoV2, getTotalV2, getTotalItemsV2, clearCarritoV2 } = useOrderStoreV2();
  const abrirMesa = useTablesStore(s => s.abrirMesa);
  const setMesaEstado = useTablesStore(s => s.setMesaEstado);

  const carrito = getCarritoV2(mesaId);
  const total = getTotalV2(mesaId);
  const totalItems = getTotalItemsV2(mesaId);

  // M — Manage
  const itemsSubcat = subcatActiva
    ? MENU_MOCK_V2.filter(i => i.subcategoria === subcatActiva.id)
    : [];

  // U — Use
  const handleSelectBloque = (bloque: Bloque) => {
    setBloqueActivo(bloque);
    setNivel('subcategorias');
  };

  const handleSelectSubcat = (subcat: Subcategoria) => {
    setSubcatActiva(subcat);
    setNivel('items');
  };

  const handleBack = () => {
    if (nivel === 'items') { setNivel('subcategorias'); setSubcatActiva(null); }
    else if (nivel === 'subcategorias') { setNivel('bloques'); setBloqueActivo(null); }
    else { navigate('/mesas'); }
  };

  const handleTapItem = (item: MenuItemV2) => {
    if (item.modificadores.length === 0) {
      addLineaV2(mesaId, item, [], '');
    } else {
      setItemModal(item);
    }
  };

  const handleConfirmModal = (mods: ModificadorSeleccionado[], nota: string) => {
    if (!itemModal) return;
    addLineaV2(mesaId, itemModal, mods, nota);
    setItemModal(null);
  };

  const handleMarchar = () => {
    try {
      if (carrito.length === 0) return;
      abrirMesa(mesaId);
      setMesaEstado(mesaId, 'OCUPADA', { totalCuenta: total });
      clearCarritoV2(mesaId);
      navigate('/mesas');
    } catch (error) {
      console.error('ORDER_V2_FAILED', error);
    }
  };

  return {
    nivel, bloques: BLOQUES_MOCK, bloqueActivo, subcatActiva,
    itemsSubcat, carrito, total, totalItems,
    carritoVisible, setCarritoVisible,
    itemModal, setItemModal,
    handleSelectBloque, handleSelectSubcat, handleBack,
    handleTapItem, handleConfirmModal, handleMarchar,
  };
}
