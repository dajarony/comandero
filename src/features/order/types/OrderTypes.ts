/**
 * @module OrderTypes
 * @description Tipos base para menú y líneas de pedido (v1)
 * SUME Docblock v2.0
 */
export type Categoria = 'Bebidas' | 'Cervezas' | 'Vinos' | 'Carnes' | 'Postres' | 'Otros';

export interface MenuItem {
  id: string;
  nombre: string;
  precio: number;
  categoria: Categoria;
  emoji: string;
}

export interface LineaPedido {
  item: MenuItem;
  cantidad: number;
  nota: string;
}
