/**
 * menuGroups — Definición de grupos de menú (Bebidas, Comida, Snacks)
 * SUME Docblock v2.0 | Tipo: Config | Salidas: MENU_GROUPS, GrupoMenu
 *
 * Cada grupo agrupa categorías por nombre.
 * Las categorías que no encajen en ningún grupo van a "Otros".
 */

export interface GrupoMenu {
  id: string;
  nombre: string;
  emoji: string;
  /** Nombres de categorías que pertenecen a este grupo */
  categorias: string[];
  /** Color de fondo para la card */
  color: string;
}

export const MENU_GROUPS: GrupoMenu[] = [
  {
    id: 'bebidas',
    nombre: 'Bebidas',
    emoji: '🍺',
    color: '#e0f2fe',
    categorias: [
      'Cervezas', 'Refrescos', 'Zumos', 'Sidras y Alcopops',
      'Aperitivos', 'Ron', 'Ginebra', 'Vodka', 'Whisky',
      'Brandy', 'Licores', 'Vinos Tintos', 'Vinos Blancos',
      'Vinos Rosados', 'Cava', 'Sangría',
    ],
  },
  {
    id: 'comida',
    nombre: 'Comida',
    emoji: '🍽️',
    color: '#fef3c7',
    categorias: [
      'Carnes', 'Pescados', 'Ensaladas', 'Sopas',
      'Tapas', 'Fritos', 'Postres',
    ],
  },
  {
    id: 'snacks',
    nombre: 'Snacks',
    emoji: '🥪',
    color: '#fce7f3',
    categorias: ['Sandwiches', 'Snacks', 'Pizzas', 'Pasta'],
  },
];
