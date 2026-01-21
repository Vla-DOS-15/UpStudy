'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { accountService } from '@/services/accountService';

export default function VerificationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [diplomaFile, setDiplomaFile] = useState<File | null>(null);

  // Захист сторінки
  useEffect(() => {
    if (!authLoading && user) {
      const isExecutor = user.roles?.includes('Executor');
      if (!isExecutor) {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passportFile || !diplomaFile) {
      toast.error('Помилка', { description: 'Завантажте обидва документи.' });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('Passport', passportFile);
    formData.append('Diploma', diplomaFile);

    try {
      await accountService.uploadVerificationDocs(formData);
      toast.success('Успішно!', { description: 'Документи відправлено.' });
      // Перезавантажуємо сторінку, щоб оновити стан користувача (якщо токен оновився)
      // Або просто перенаправляємо на дашборд, де користувач побачить новий статус
      window.location.reload(); 
    } catch (error: any) {
      toast.error('Помилка', { description: error.response?.data || 'Спробуйте пізніше.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  // --- СТАН 1: ВЖЕ ВЕРИФІКОВАНИЙ ---
  if (user.isVerified) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-green-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold">Ваш акаунт верифіковано!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Вітаємо! Ви маєте повний доступ до біржі замовлень. Бажаємо успішної роботи.
        </p>
        <Button onClick={() => router.push('/dashboard/market')}>Перейти до біржі</Button>
      </div>
    );
  }

  // --- СТАН 2: ОЧІКУВАННЯ ПЕРЕВІРКИ ---
  if (user.isVerificationPending) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
        <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-amber-600">
          <Clock className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold">Документи на перевірці</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Ми отримали ваші документи. Адміністратор перевірить їх найближчим часом (зазвичай це займає до 24 годин).
          Ви отримаєте сповіщення про результат.
        </p>
        <Alert className="bg-muted text-left max-w-lg mx-auto mt-8">
          <AlertTitle>Поки ви чекаєте...</AlertTitle>
          <AlertDescription>
            Ви можете заповнити свій профіль, додати аватарку та опис навичок, щоб замовники краще вас впізнавали.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push('/dashboard/profile')}>
          Перейти до профілю
        </Button>
      </div>
    );
  }

  // --- СТАН 3: ФОРМА ЗАВАНТАЖЕННЯ (Default) ---
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Верифікація виконавця</h2>
        <p className="text-muted-foreground">
          Завантажте документи для підтвердження особи.
        </p>
      </div>

      <Alert className="bg-blue-50 text-blue-800 border-blue-200">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Конфіденційність гарантовано</AlertTitle>
        <AlertDescription>
          Ваші дані зашифровані і використовуються виключно для верифікації.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Завантаження фотокопій</CardTitle>
          <CardDescription>JPG, PNG, PDF (макс. 10MB)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>1. Паспорт / ID-картка</Label>
                <div className="border-2 border-dashed rounded-lg p-8 hover:bg-accent/50 transition cursor-pointer relative group text-center">
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                    accept="image/*,application/pdf"
                  />
                  <UploadCloud className={`h-10 w-10 mx-auto mb-3 ${passportFile ? 'text-green-500' : 'text-muted-foreground'}`} />
                  {passportFile ? (
                    <span className="font-medium text-green-600 block">{passportFile.name}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Натисніть для вибору файлу</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>2. Диплом / Студентський</Label>
                <div className="border-2 border-dashed rounded-lg p-8 hover:bg-accent/50 transition cursor-pointer relative group text-center">
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setDiplomaFile(e.target.files?.[0] || null)}
                    accept="image/*,application/pdf"
                  />
                  <UploadCloud className={`h-10 w-10 mx-auto mb-3 ${diplomaFile ? 'text-green-500' : 'text-muted-foreground'}`} />
                  {diplomaFile ? (
                    <span className="font-medium text-green-600 block">{diplomaFile.name}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Натисніть для вибору файлу</span>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Надіслати на перевірку
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}