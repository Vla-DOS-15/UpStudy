// types/index.ts

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles?: string[];
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
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}