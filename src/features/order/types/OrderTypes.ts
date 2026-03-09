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
