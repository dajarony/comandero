import type { ItemImportado } from '../types/MenuIngestTypes';

const CATEGORIAS_KEYWORDS: Record<string, string[]> = {
  Bebidas: ['agua', 'café', 'cafe', 'té', 'te', 'zumo', 'refresco', 'cola', 'fanta', 'limon'],
  Cervezas: ['caña', 'cana', 'cerveza', 'jarra', 'radler', 'stout', 'ipa'],
  Vinos: ['vino', 'rioja', 'albariño', 'albarino', 'cava', 'champan', 'rosado'],
  Carnes: ['hamburguesa', 'entrecot', 'pollo', 'chuleton', 'costilla', 'ternera', 'cerdo', 'carne'],
  Postres: ['tarta', 'brownie', 'helado', 'tiramisu', 'flan', 'mousse', 'crepe', 'postre'],
  Otros: [],
};

const CATEGORIA_EMOJIS: Record<string, string> = {
  Bebidas: '🥤',
  Cervezas: '🍺',
  Vinos: '🍷',
  Carnes: '🥩',
  Postres: '🍰',
  Otros: '🍽️',
};

function categorizarItem(nombre: string): { categoria: string; emoji: string } {
  const nombreLower = nombre.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORIAS_KEYWORDS)) {
    if (cat === 'Otros') continue;
    if (keywords.some(k => nombreLower.includes(k))) {
      return { categoria: cat, emoji: CATEGORIA_EMOJIS[cat] };
    }
  }
  return { categoria: 'Otros', emoji: '🍽️' };
}

export const menuIngestApi = {
  procesarCSV: async (csvText: string): Promise<ItemImportado[]> => {
    const lineas = csvText.trim().split('\n').slice(1);
    return lineas
      .map(linea => {
        const partes = linea.split(',');
        const nombre = (partes[0] ?? '').trim();
        const precioStr = (partes[1] ?? '').trim().replace(',', '.');
        const precio = parseFloat(precioStr) || 0;
        const { categoria, emoji } = categorizarItem(nombre);
        return { nombre, precio, categoriaDetectada: categoria, emoji };
      })
      .filter(i => i.nombre.length > 0);
  },

  guardarMenu: async (_items: ItemImportado[]) => Promise.resolve({ ok: true }),
};
