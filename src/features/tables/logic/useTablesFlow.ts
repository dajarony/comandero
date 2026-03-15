/**
 * Tables Flow — Carga mesas reales del backend
 * 
 * Entradas: filtro de mesa, búsqueda por número
 * Acciones: fetch real, filtra mesas, navega según estado
 * Salidas: mesas filtradas, conteos, handler de tap
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTablesStore } from '../state/tablesStore';
import { tablesApi } from '../api/tablesApi';
import type { Mesa } from '../types/TablesTypes';

export function useTablesFlow() {
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();

  const mesas = useTablesStore(s => s.mesas);
  const loading = useTablesStore(s => s.loading);
  const error = useTablesStore(s => s.error);
  // filtro y setFiltro vienen del store — estado único, sin duplicado local
  const filtro = useTablesStore(s => s.filtro);
  const setFiltro = useTablesStore(s => s.setFiltro);
  const setMesas = useTablesStore(s => s.setMesas);
  const setLoading = useTablesStore(s => s.setLoading);
  const setError = useTablesStore(s => s.setError);

  // Cargar mesas reales del backend al montar
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await tablesApi.fetchMesas();
        if (mounted) setMesas(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Error cargando mesas');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [setMesas, setLoading, setError]);

  // Filtrado
  const mesasFiltradas = mesas.filter(m => {
    const coincideFiltro =
      filtro === 'TODAS' ||
      (filtro === 'LIBRES' && m.estado === 'LIBRE') ||
      (filtro === 'OCUPADAS' && m.estado === 'OCUPADA') ||
      (filtro === 'PENDIENTE_COBRO' && m.estado === 'PENDIENTE_COBRO');
    const coincideBusqueda = busqueda === '' || m.numero.includes(busqueda);
    return coincideFiltro && coincideBusqueda;
  });

  const conteos = {
    libres: mesas.filter(m => m.estado === 'LIBRE').length,
    ocupadas: mesas.filter(m => m.estado === 'OCUPADA').length,
    pendiente: mesas.filter(m => m.estado === 'PENDIENTE_COBRO').length,
  };

  const handleTapMesa = (mesa: Mesa) => {
    if (mesa.estado === 'PENDIENTE_COBRO') {
      navigate(`/cobro/${mesa.id}`);
    } else {
      navigate(`/comanda/${mesa.id}`);
    }
  };

  return {
    mesasFiltradas, conteos, filtro, setFiltro,
    busqueda, setBusqueda, handleTapMesa, loading, error,
  };
}
