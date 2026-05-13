/**
 * @module UserTypes
 * @description Definiciones de tipos para el personal del restaurante.
 */

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'CAMARERO' | 'COCINA';
  activo: boolean;
}
