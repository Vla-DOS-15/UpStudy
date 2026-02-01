'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { LoginDto, RegisterDto, User } from '@/types';
import { authService } from '@/services/authService';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser({
          id: decoded.nameid || decoded.sub,
          email: decoded.email,
          firstName: decoded.given_name || decoded.GivenName || '',
          lastName: decoded.family_name || decoded.FamilyName || '',
          userName: decoded.unique_name || decoded.name || decoded.Name || '',
          phoneNumber: decoded.phone_number || decoded.mobilephone || decoded.MobilePhone || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone'] || '',
          roles: decoded.role ? (Array.isArray(decoded.role) ? decoded.role : [decoded.role]) : [],
          // Конвертуємо рядки "True"/"False" або булеві значення
          isVerified: decoded.IsVerified === 'True' || decoded.IsVerified === true,
          isVerificationPending: decoded.IsVerificationPending === 'True' || decoded.IsVerificationPending === true,
          bankCardNumber: decoded.BankCardNumber || '',
          bankCardOwnerName: decoded.BankCardOwnerName || '',
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

        const decoded: any = jwtDecode(res.accessToken);
        setUser({
          id: decoded.nameid,
          email: decoded.email,
          firstName: decoded.given_name || decoded.GivenName || '',
          lastName: decoded.family_name || decoded.FamilyName || '',
          userName: decoded.unique_name || decoded.name || decoded.Name || '',
          phoneNumber: decoded.phone_number || decoded.mobilephone || decoded.MobilePhone || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone'] || '',
          roles: decoded.role || [],
          isVerified: decoded.IsVerified === 'True' || decoded.IsVerified === true,
          isVerificationPending: decoded.IsVerificationPending === 'True' || decoded.IsVerificationPending === true,
          bankCardNumber: decoded.BankCardNumber || '',
          bankCardOwnerName: decoded.BankCardOwnerName || '',
        });

        router.push('/dashboard');
      } else {
        throw new Error(res.message || 'Помилка входу');
      }
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  };

  const googleLogin = async (idToken: string) => {
    try {
      const res = await authService.googleLogin(idToken);
      if (res.isSuccess) {
        Cookies.set('accessToken', res.accessToken);
        Cookies.set('refreshToken', res.refreshToken);

        const decoded: any = jwtDecode(res.accessToken);
        setUser({
          id: decoded.nameid,
          email: decoded.email,
          firstName: decoded.given_name || decoded.GivenName || '',
          lastName: decoded.family_name || decoded.FamilyName || '',
          userName: decoded.unique_name || decoded.name || decoded.Name || '',
          phoneNumber: decoded.phone_number || decoded.mobilephone || decoded.MobilePhone || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone'] || '',
          roles: decoded.role || [],
          isVerified: decoded.IsVerified === 'True' || decoded.IsVerified === true,
          isVerificationPending: decoded.IsVerificationPending === 'True' || decoded.IsVerificationPending === true,
          bankCardNumber: decoded.BankCardNumber || '',
          bankCardOwnerName: decoded.BankCardOwnerName || '',
        });

        router.push('/dashboard');
      } else {
        throw new Error(res.message || 'Помилка входу через Google');
      }
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  };

  const register = async (data: RegisterDto) => {
    try {
      const res = await authService.register(data);
      if (res.isSuccess) {
        await login({ email: data.email, password: data.password });
      } else {
        throw new Error(res.message || 'Помилка реєстрації');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    setUser(null);
    window.location.href = '/';
  };

  const refreshUser = async () => {
    const token = Cookies.get('accessToken');
    if (token) {
      // logic
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};