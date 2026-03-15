/**
 * Auth API — Conecta con el backend real
 */
import { apiClient } from '@/core/api/apiClient';
import type { TokenResponse, LoginPayload, UsuarioResponse } from '../types/AuthTypes';

export const authApi = {
  /** Login → POST /auth/login → devuelve JWT + usuario */
  login: (payload: LoginPayload): Promise<TokenResponse> =>
    apiClient.post<TokenResponse>('/auth/login', payload),

  /** Mi perfil → GET /auth/me */
  getMe: (): Promise<UsuarioResponse> =>
    apiClient.get<UsuarioResponse>('/auth/me'),
};
