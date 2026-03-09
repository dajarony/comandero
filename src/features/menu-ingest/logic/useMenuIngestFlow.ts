/**
 * SUME DOCBLOCK
 * Nombre: Menu Ingest Flow
 * Tipo: Logic Block
 *
 * Entradas: archivo CSV (drag & drop o file input)
 * Acciones: parsea CSV, categoriza items (mock IA), muestra preview
 * Salidas: items importados, estado del proceso, handlers
 * Errores: MENU_INGEST_PARSE_FAILED, MENU_INGEST_SAVE_FAILED
 * Dependencias: menuIngestStore, menuIngestApi
 */
import type React from 'react';
import { useMenuIngestStore } from '../state/menuIngestStore';
import { menuIngestApi } from '../api/menuIngestApi';
import { handleError } from '@/core/errors/errorHandler';

export function useMenuIngestFlow() {
  // S — Setup
  const { items, estado, setItems, setEstado, clear } = useMenuIngestStore();

  // U — Use
  const handleArchivoCSV = async (archivo: File) => {
    try {
      setEstado('PROCESANDO');
      const texto = await archivo.text();
      const itemsImportados = await menuIngestApi.procesarCSV(texto);
      setItems(itemsImportados);
      setEstado('REVISANDO');
    } catch (error) {
      handleError(error, 'MENU_INGEST_PARSE_FAILED');
      setEstado('IDLE');
    }
  };

  const handleGuardar = async () => {
    try {
      setEstado('PROCESANDO');
      await menuIngestApi.guardarMenu(items);
      setEstado('GUARDADO');
    } catch (error) {
      handleError(error, 'MENU_INGEST_SAVE_FAILED');
      setEstado('REVISANDO');
    }
  };

  // M — Manage
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const archivo = e.dataTransfer.files[0];
    if (archivo?.name.endsWith('.csv')) {
      handleArchivoCSV(archivo);
    }
  };

  // E — handled in each handler above

  return { items, estado, handleArchivoCSV, handleGuardar, handleDrop, clear };
}
