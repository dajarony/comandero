import type { MenuItem, Categoria } from '../types/OrderTypes';

export const CATEGORIAS: Categoria[] = ['Bebidas', 'Cervezas', 'Vinos', 'Carnes', 'Postres', 'Otros'];

export const MENU_MOCK: MenuItem[] = [
  // Bebidas
  { id: 'b1', nombre: 'Agua', precio: 1.50, categoria: 'Bebidas', emoji: '💧' },
  { id: 'b2', nombre: 'Coca Cola', precio: 2.50, categoria: 'Bebidas', emoji: '🥤' },
  { id: 'b3', nombre: 'Zumo Naranja', precio: 2.80, categoria: 'Bebidas', emoji: '🍊' },
  { id: 'b4', nombre: 'Café Solo', precio: 1.50, categoria: 'Bebidas', emoji: '☕' },
  { id: 'b5', nombre: 'Té', precio: 1.80, categoria: 'Bebidas', emoji: '🍵' },
  { id: 'b6', nombre: 'Refresco Limón', precio: 2.20, categoria: 'Bebidas', emoji: '🍋' },
  // Cervezas
  { id: 'c1', nombre: 'Caña', precio: 2.00, categoria: 'Cervezas', emoji: '🍺' },
  { id: 'c2', nombre: 'Cerveza 1/3', precio: 2.50, categoria: 'Cervezas', emoji: '🍺' },
  { id: 'c3', nombre: 'Cerveza Sin', precio: 2.50, categoria: 'Cervezas', emoji: '🍺' },
  { id: 'c4', nombre: 'Jarra', precio: 4.00, categoria: 'Cervezas', emoji: '🍺' },
  { id: 'c5', nombre: 'Radler', precio: 2.80, categoria: 'Cervezas', emoji: '🍺' },
  // Vinos
  { id: 'v1', nombre: 'Vino Tinto', precio: 2.50, categoria: 'Vinos', emoji: '🍷' },
  { id: 'v2', nombre: 'Vino Blanco', precio: 2.50, categoria: 'Vinos', emoji: '🥂' },
  { id: 'v3', nombre: 'Rioja Crianza', precio: 4.50, categoria: 'Vinos', emoji: '🍷' },
  { id: 'v4', nombre: 'Albariño', precio: 4.00, categoria: 'Vinos', emoji: '🥂' },
  { id: 'v5', nombre: 'Cava Brut', precio: 5.00, categoria: 'Vinos', emoji: '🍾' },
  // Carnes
  { id: 'ca1', nombre: 'Hamburguesa', precio: 12.00, categoria: 'Carnes', emoji: '🍔' },
  { id: 'ca2', nombre: 'Entrecot 300g', precio: 18.00, categoria: 'Carnes', emoji: '🥩' },
  { id: 'ca3', nombre: 'Pollo Brasa', precio: 13.50, categoria: 'Carnes', emoji: '🍗' },
  { id: 'ca4', nombre: 'Chuletón 500g', precio: 28.00, categoria: 'Carnes', emoji: '🥩' },
  { id: 'ca5', nombre: 'Costillas BBQ', precio: 16.00, categoria: 'Carnes', emoji: '🍖' },
  // Postres
  { id: 'p1', nombre: 'Tarta Queso', precio: 5.50, categoria: 'Postres', emoji: '🍰' },
  { id: 'p2', nombre: 'Brownie', precio: 4.50, categoria: 'Postres', emoji: '🍫' },
  { id: 'p3', nombre: 'Helado 2 Bolas', precio: 3.50, categoria: 'Postres', emoji: '🍨' },
  { id: 'p4', nombre: 'Tiramisú', precio: 5.00, categoria: 'Postres', emoji: '🍮' },
  { id: 'p5', nombre: 'Flan Casero', precio: 4.00, categoria: 'Postres', emoji: '🍮' },
  // Otros
  { id: 'o1', nombre: 'Patatas Bravas', precio: 6.00, categoria: 'Otros', emoji: '🍟' },
  { id: 'o2', nombre: 'Ensalada César', precio: 9.00, categoria: 'Otros', emoji: '🥗' },
  { id: 'o3', nombre: 'Pan de Ajo', precio: 3.50, categoria: 'Otros', emoji: '🍞' },
  { id: 'o4', nombre: 'Croquetas (6ud)', precio: 7.00, categoria: 'Otros', emoji: '🫓' },
  { id: 'o5', nombre: 'Tabla de Quesos', precio: 12.00, categoria: 'Otros', emoji: '🧀' },
];

export const orderApi = {
  fetchMenu: async (): Promise<MenuItem[]> => Promise.resolve(MENU_MOCK),
};
