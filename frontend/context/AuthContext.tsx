'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { LoginDto, RegisterDto, User } from '@/types';
import { authService } from '@/services/authService';
import { jwtDecode } from 'jwt-decode'; // npm install jwt-decode

interface AuthContextType {
  user: User | null;
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // При завантаженні перевіряємо токен
    const token = Cookies.get('accessToken');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // Мапимо claims з JWT у об'єкт User
        setUser({
          id: decoded.nameid || decoded.sub,
          email: decoded.email,
          firstName: decoded.given_name || '', // Якщо ти пакуєш це в токен
          lastName: decoded.family_name || '',
          roles: decoded.role ? (Array.isArray(decoded.role) ? decoded.role : [decoded.role]) : [],
        });
      } catch (e) {
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (data: LoginDto) => {
    try {
      const res = await authService.login(data);
      if (res.isSuccess) {
        Cookies.set('accessToken', res.accessToken);
        Cookies.set('refreshToken', res.refreshToken);
        
        // Оновлюємо стан юзера (декодуємо токен)
        const decoded: any = jwtDecode(res.accessToken);
        setUser({
            id: decoded.nameid,
            email: decoded.email,
            firstName: decoded.given_name || 'User',
            lastName: '',
            roles: decoded.role || []
        });
        
        router.push('/dashboard'); // Або інша сторінка
      } else {
        alert(res.message);
      }
    } catch (error) {
      console.error(error);
      alert('Помилка входу');
    }
  };

  const register = async (data: RegisterDto) => {
    try {
      const res = await authService.register(data);
      if (res.isSuccess) {
        // Можна одразу логінити або просити залогінитись
        await login({ email: data.email, password: data.password });
      } else {
        alert(res.message);
      }
    } catch (error) {
      alert('Помилка реєстрації');
    }
  };

  const logout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};