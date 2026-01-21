// services/authService.ts
import api from '@/lib/axios';
import { LoginDto, RegisterDto, AuthResponse, RefreshTokenDto } from '@/types';

export const authService = {
  async login(data: LoginDto) {
    const response = await api.post<AuthResponse>('/Auth/login', data);
    return response.data;
  },

  async register(data: RegisterDto) {
    const response = await api.post<AuthResponse>('/Auth/register', data);
    return response.data;
  },

  async googleLogin(idToken: string) {
    const response = await api.post<AuthResponse>('/Auth/google-login', { idToken });
    return response.data;
  },
  
  // Додай цей ендпоінт на бекенд, якщо його немає (GET /Account/me)
  // або декодуй JWT на клієнті
  async getCurrentUser() {
     // Тимчасово повертаємо null або реалізуй endpoint
     // return api.get<User>('/Account/me'); 
     return null; 
  },

  async refreshToken(data: RefreshTokenDto) {
    const response = await api.post<AuthResponse>('/Auth/refresh-token', data);
    return response.data;
  },
};