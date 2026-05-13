/**
 * @module OrderTypesV2
 * @description Tipos v2 con modificadores, bloques y subcategorías
 * SUME Docblock v2.0
 */

export type TipoModificador = 'radio' | 'checkbox' | 'stepper' | 'textarea';

export interface OpcionModificador {
  id: string;
  label: string;
  precioExtra: number;
}

export interface Modificador {
  id: string;
  nombre: string;
  tipo: TipoModificador;
  obligatorio: boolean;
  opciones: OpcionModificador[];
  maxStepper?: number; // solo para tipo stepper
}

export interface MenuItemV2 {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  emoji: string;
  foto?: string;
  bloque: string;
  subcategoria: string;
  modificadores: Modificador[];
}

export interface Subcategoria {
  id: string;
  nombre: string;
  emoji: string;
  bloqueId: string;
}

export interface Bloque {
  id: string;
  nombre: string;
  emoji: string;
  colorClass: string; // Tailwind bg color
  subcategorias: Subcategoria[];
}

export interface ModificadorSeleccionado {
  modificadorId: string;
  valor: string | string[] | number; // radio→string, checkbox→string[], stepper→number
  precioExtra: number;
}

export interface LineaPedidoV2 {
  item: MenuItemV2;
  cantidad: number;
  nota: string;
  modificadores: ModificadorSeleccionado[];
  precioUnitario: number; // precio base + extras
}
