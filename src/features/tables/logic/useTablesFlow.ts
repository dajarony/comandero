/**
 * SUME DOCBLOCK
 * Nombre: Tables Flow
 * Tipo: Logic Block
 *
 * Entradas: filtro de mesa, búsqueda por número
 * Acciones: filtra mesas, navega a comanda o cobro según estado
 * Salidas: mesas filtradas, handler de tap
 * Errores: TABLES_NAVIGATE_FAILED
 * Dependencias: tablesStore, react-router-dom
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTablesStore } from '../state/tablesStore';
import type { FiltroMesa, Mesa } from '../types/TablesTypes';
import { handleError } from '@/core/errors/errorHandler';

export function useTablesFlow() {
  // S — Setup
  const [filtro, setFiltro] = useState<FiltroMesa>('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();
  const mesas = useTablesStore(s => s.mesas);

  // M — Manage (filtrado)
  const mesasFiltradas = mesas.filter(m => {
    const coincideFiltro =
      filtro === 'TODAS' ||
      (filtro === 'LIBRES' && m.estado === 'LIBRE') ||
      (filtro === 'OCUPADAS' && m.estado === 'OCUPADA') ||
      (filtro === 'PENDIENTE_COBRO' && m.estado === 'PENDIENTE_COBRO');
    const coincideBusqueda = busqueda === '' || m.id.includes(busqueda);
    return coincideFiltro && coincideBusqueda;
  });

  const conteos = {
    libres: mesas.filter(m => m.estado === 'LIBRE').length,
    ocupadas: mesas.filter(m => m.estado === 'OCUPADA').length,
    pendiente: mesas.filter(m => m.estado === 'PENDIENTE_COBRO').length,
  };

  // U — Use (acción principal)
  const handleTapMesa = (mesa: Mesa) => {
    try {
      if (mesa.estado === 'PENDIENTE_COBRO') {
        navigate(`/cobro/${mesa.id}`);
      } else {
        navigate(`/comanda/${mesa.id}`);
      }
    } catch (error) {
      handleError(error, 'TABLES_NAVIGATE_FAILED');
    }
  };

  return {
    mesasFiltradas,
    conteos,
    filtro,
    setFiltro,
    busqueda,
    setBusqueda,
    handleTapMesa,
  };
}
