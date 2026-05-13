/**
 * @module ia/types
 * @description Tipos de dominio para el módulo de Asistente IA.
 * SUME Docblock v2.0
 */

export interface AccionEjecutada {
  funcion: string;
  args: Record<string, unknown>;
  resultado: string;
}

export interface MensajeChat {
  rol: 'usuario' | 'asistente';
  contenido: string;
  timestamp: Date;
  accion?: AccionEjecutada | null;
}

export interface InformeIA {
  informe: string;
  datos: {
    ventas: number;
    coste_diario: number;
    beneficio_bruto: number;
    beneficio_neto: number;
    reserva_iva: number;
  };
}
