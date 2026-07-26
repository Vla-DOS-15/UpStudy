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
  emailConfirmed: boolean;
  avatarUrl?: string;
  preferredDisciplineIds?: number[];
  phoneNumber?: string;
  telegram?: string;
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
  phoneNumber?: string;
  telegram?: string;
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

export interface TransactionDto {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  isExpense: boolean;
}

export interface BalanceOverviewDto {
  totalEarned: number;
  totalSpent: number;
  transactions: TransactionDto[];
}

export interface ConsultantPreviewDto {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  rating: number;
  completedOrdersCount: number;
  isVerified: boolean;
  aboutMe: string | null;
  disciplines: string[];
}