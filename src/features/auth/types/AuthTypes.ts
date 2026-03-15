/**
 * Tipos de autenticación — Coinciden con contratos del backend
 */

export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'CAMARERO';
  activo: boolean;
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
