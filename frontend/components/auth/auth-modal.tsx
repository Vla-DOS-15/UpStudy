'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { Button } from '@/components/ui/button';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { useTheme } from 'next-themes';

export function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [role, setRole] = useState<'Client' | 'Executor'>('Client');
  const { googleLogin } = useAuth();
  const { resolvedTheme } = useTheme();

  const closeDialog = () => setIsOpen(false);

  const login = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        await googleLogin(
          codeResponse.code,
          activeTab === 'register' ? role : undefined
        );
        toast.success(activeTab === 'register' ? "Акаунт створено!" : "З поверненням!");
        closeDialog();
      } catch (error: any) {
        const message = getErrorMessage(error);
        toast.error("Помилка авторизації через Google", { description: message });
      }
    },
    onError: () => toast.error("Помилка Google Auth"),
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex gap-2">
        <DialogTrigger asChild>
          <Button variant="ghost" onClick={() => setActiveTab("login")}>Увійти</Button>
        </DialogTrigger>
        <DialogTrigger asChild>
          <Button onClick={() => setActiveTab("register")}>Зареєструватись</Button>
        </DialogTrigger>
      </div>

      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {activeTab === 'login' ? 'Вхід в UpStudy' : 'Створення акаунту'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {activeTab === 'login'
              ? 'Введіть дані для доступу до кабінету'
              : 'Оберіть роль та долучайтесь до платформи'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "login" | "register")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вхід</TabsTrigger>
            <TabsTrigger value="register">Реєстрація</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <LoginForm onSuccess={closeDialog} />
          </TabsContent>

          <TabsContent value="register">
            <RegisterForm onSuccess={closeDialog} role={role} setRole={setRole} />
          </TabsContent>
        </Tabs>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Або</span>
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full py-5" 
            onClick={() => login()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 mr-2">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Продовжити через Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}