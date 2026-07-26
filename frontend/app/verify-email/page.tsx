'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { authService } from '@/services/authService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

export default function VerifyEmailPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.emailConfirmed) {
      if (user.roles?.includes('Admin')) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      toast.error('Електронна пошта не знайдена. Спробуйте увійти знову.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.verifyEmail(user.email, code);
      if (res.isSuccess) {
        toast.success('Електронна пошта успішно підтверджена!');
        
        // Оновлюємо токени, бо вони повернулися в респонсі з новим статусом
        if (res.accessToken && res.refreshToken) {
           Cookies.set('accessToken', res.accessToken, { expires: 7 });
           Cookies.set('refreshToken', res.refreshToken, { expires: 7 });
        }

        updateUser({ emailConfirmed: true });
        
        if (user.roles?.includes('Executor')) {
           router.push('/dashboard/verification');
        } else {
           router.push('/dashboard');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data || 'Не вдалося підтвердити пошту.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!user?.email) return;
    try {
      setIsResending(true);
      const res = await authService.resendVerification(user.email);
      if (res.isSuccess) {
        toast.success('Новий код відправлено на вашу пошту.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не вдалося відправити код повторно.');
    } finally {
      setIsResending(false);
    }
  };

  if (!user) {
    return null; // або Loading spinner
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Підтвердження Email</CardTitle>
          <CardDescription>
            Ми відправили 4-значний код на <b>{user.email}</b>. Введіть його нижче, щоб завершити реєстрацію.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Код підтвердження</Label>
              <Input
                id="code"
                placeholder="1234"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="text-center text-lg tracking-widest font-mono"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || code.length !== 4}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Підтвердити
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button variant="ghost" onClick={handleResend} disabled={isResending} className="w-full">
             {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             Відправити код ще раз
          </Button>
          <Button variant="link" onClick={logout} className="w-full text-muted-foreground">
             Вийти з акаунту
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
