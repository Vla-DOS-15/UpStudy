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
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const updateUser = (updatedFields: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updatedFields } : null);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get('accessToken');
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          let currentUser: User = {
            id: decoded.nameid || decoded.sub,
            email: decoded.email,
            firstName: decoded.given_name || '',
            lastName: decoded.family_name || '',
            userName: decoded.family_name || '',
            roles: decoded.role ? (Array.isArray(decoded.role) ? decoded.role : [decoded.role]) : [],
            isVerified: decoded.IsVerified === 'True' || decoded.IsVerified === true,
            isVerificationPending: decoded.IsVerificationPending === 'True' || decoded.IsVerificationPending === true,
          };
          
          setUser(currentUser); // Одразу встановлюємо базові дані з токена

          try {
            const { accountService } = await import('@/services/accountService');
            const me = await accountService.getMe();
            if (me) {
              currentUser = {
                ...currentUser,
                firstName: me.firstName || currentUser.firstName,
                lastName: me.lastName || currentUser.lastName,
                avatarUrl: me.avatarUrl,
                preferredDisciplineIds: me.preferredDisciplineIds || [],
              };
              setUser(currentUser);
            }
          } catch (e) {
            console.error('Failed to fetch full profile', e);
          }
        } catch (e) {
          logout();
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (data: LoginDto) => {
    try {
      const res = await authService.login(data);
      if (res.isSuccess) {
        Cookies.set('accessToken', res.accessToken);
        Cookies.set('refreshToken', res.refreshToken);
        
        const decoded: any = jwtDecode(res.accessToken);
            const userRoles = decoded.role ? (Array.isArray(decoded.role) ? decoded.role : [decoded.role]) : [];
            
            setUser({
                id: decoded.nameid,
                email: decoded.email,
                firstName: decoded.given_name || 'User',
                lastName: '',
                userName: decoded.family_name || '',
                roles: userRoles,
                isVerified: decoded.IsVerified === 'True' || decoded.IsVerified === true,
                isVerificationPending: decoded.IsVerificationPending === 'True' || decoded.IsVerificationPending === true,
            });
            
            if (userRoles.includes('Admin')) {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
      } else {
        throw new Error(res.message || 'Помилка входу');
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
    // Використовуємо window.location для повного очищення стану додатку
    window.location.href = '/'; 
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};