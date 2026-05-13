/**
 * @module MenuIngestTypes
 * @description Tipos de ingesta de carta — items importados y estado del flujo
 * SUME Docblock v2.0
 */
export interface ItemImportado {
  nombre: string;
  precio: number;
  categoriaDetectada: string;
  emoji: string;
}

export type EstadoIngesta = 'IDLE' | 'PROCESANDO' | 'REVISANDO' | 'GUARDADO';
