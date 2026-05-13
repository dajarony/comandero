/**
 * @module gastosApi
 * @description Funciones de acceso a la API REST para el módulo de Gastos.
 * SUME Docblock v2.0
 * Entradas : datos de formulario (GastoForm), id de gasto (number)
 * Lógica   : Llamadas HTTP via apiClient a los endpoints /gastos/
 * Salidas  : Promise<Gasto | Gasto[] | GastosResumen | void>
 */

import { apiClient } from '@/core/api/apiClient';
import type { Gasto, GastoForm, GastosResumen } from '../types';

export const fetchGastos = (): Promise<Gasto[]> =>
  apiClient.get<Gasto[]>('/gastos/');

export const fetchResumen = (): Promise<GastosResumen> =>
  apiClient.get<GastosResumen>('/gastos/resumen');

export const crearGasto = (data: GastoForm): Promise<Gasto> =>
  apiClient.post<Gasto>('/gastos/', data);

export const actualizarGasto = (id: number, data: Partial<GastoForm>): Promise<Gasto> =>
  apiClient.put<Gasto>(`/gastos/${id}`, data);

export const eliminarGasto = (id: number): Promise<void> =>
  apiClient.delete<void>(`/gastos/${id}`);
