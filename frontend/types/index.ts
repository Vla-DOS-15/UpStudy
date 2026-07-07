// types/index.ts

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  roles?: string[];
  role?: string;
  isVerified: boolean;
  isVerificationPending: boolean;
  avatarUrl?: string;
}

export interface AuthResponse {
  isSuccess: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  // Якщо ти вирішиш повертати об'єкт юзера при логіні, додай його сюди
  // Наразі декодуватимемо з токена або робитимемо запит /me
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  role: 'Client' | 'Executor';
  userName: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface RefreshTokenDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  isSuccess: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
}