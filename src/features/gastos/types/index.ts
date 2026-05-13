/**
 * @module gastos/types
 * @description Tipos de dominio para el módulo de Gastos del Negocio.
 * SUME Docblock v2.0
 * Entradas : N/A (tipos puros)
 * Lógica   : Definición de interfaces y tipos para gastos, resumen y formulario
 * Salidas  : Tipos exportados para uso en api, state y ui
 */

export type CategoriaGasto = 'FIJO_MENSUAL' | 'NOMINA' | 'VARIABLE' | 'IRREGULAR';

export interface Gasto {
  id: number;
  nombre: string;
  categoria: CategoriaGasto;
  importe: number;
  dia_vencimiento: number | null;
  activo: boolean;
}

export interface GastosResumen {
  total_mensual: number;
  coste_diario: number;
  por_categoria: Record<CategoriaGasto, number>;
  proximos_vencimientos: Gasto[];
}

export interface GastoForm {
  nombre: string;
  categoria: CategoriaGasto;
  importe: number;
  dia_vencimiento: number | null;
}
