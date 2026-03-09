export interface ItemImportado {
  nombre: string;
  precio: number;
  categoriaDetectada: string;
  emoji: string;
}

export type EstadoIngesta = 'IDLE' | 'PROCESANDO' | 'REVISANDO' | 'GUARDADO';
