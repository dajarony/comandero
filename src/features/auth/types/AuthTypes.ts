/**
 * @module AuthTypes
 * @description Tipos TypeScript para autenticación (contratos del backend)
 * SUME Docblock v2.0
 */

export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'CAMARERO' | 'COCINA';
  activo: boolean;
  modo?: 'COMANDERO' | 'TPV';
  restaurante_id?: number | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  usuario: UsuarioResponse;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegistroRestaurantePayload {
  nombre_restaurante: string;
  nombre_admin: string;
  email: string;
  password: string;
}
