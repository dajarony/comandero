/**
 * @module CheckoutTypes
 * @description Tipos para cobro: método de pago y resumen de items
 * SUME Docblock v2.0
 */
export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'QR';

export interface ItemResumen {
  nombre: string;
  cantidad: number;
  precioUnit: number;
  emoji: string;
  subtotal: number;
}
