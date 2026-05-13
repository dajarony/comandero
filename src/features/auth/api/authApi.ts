/**
 * @module authApi
 * @description Capa API de autenticación contra backend FastAPI
 * SUME Docblock v2.0
 * Entradas : LoginPayload (email + password)
 * Lógica   : POST /auth/login para JWT, GET /auth/me para perfil
 * Salidas  : TokenResponse | UsuarioResponse
 */
import { apiClient } from '@/core/api/apiClient';
import type { TokenResponse, LoginPayload, UsuarioResponse, RegistroRestaurantePayload } from '../types/AuthTypes';

export const authApi = {
  /** Login → POST /auth/login → devuelve JWT + usuario */
  login: (payload: LoginPayload): Promise<TokenResponse> =>
    apiClient.post<TokenResponse>('/auth/login', payload),

  /** Registro restaurante nuevo → POST /auth/registro-restaurante → JWT */
  registrarRestaurante: (payload: RegistroRestaurantePayload): Promise<TokenResponse> =>
    apiClient.post<TokenResponse>('/auth/registro-restaurante', payload),

  /** Mi perfil → GET /auth/me */
  getMe: (): Promise<UsuarioResponse> =>
    apiClient.get<UsuarioResponse>('/auth/me'),
};
