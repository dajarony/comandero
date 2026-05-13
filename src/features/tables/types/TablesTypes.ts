/**
 * @module TablesTypes
 * @description Tipos e interfaces de mesas — contrato con backend
 * SUME Docblock v2.0
 */

export type MesaEstado = 'LIBRE' | 'OCUPADA' | 'PENDIENTE_COBRO';

export interface Mesa {
  id: number;
  numero: string;
  estado: MesaEstado;
  comensales: number | null;
  hora_apertura: string | null;
  nota?: string | null;
  total_cuenta: number;
}

export type FiltroMesa = 'TODAS' | 'LIBRES' | 'OCUPADAS' | 'PENDIENTE_COBRO';
